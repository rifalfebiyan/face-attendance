import flask
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from supabase import create_client, Client
import face_recognition
import numpy as np
import os
import json
import base64
import cv2
from datetime import datetime, date, timedelta, timezone

from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# Enable CORS for HTTP
CORS(app)
# Enable SocketIO with CORS
socketio = SocketIO(app, cors_allowed_origins="*")

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Global storage for face encodings (cache for fast recognition)
# Structure: { "user_id": { "name": "Name", "encodings": [encoding1, ...] } }
known_faces_cache = {}
# Debounce cache: { "user_id": timestamp }
last_processed_cache = {}

def load_data_from_supabase():
    global known_faces_cache
    print("Loading data from Supabase...")
    try:
        response = supabase.table('employees').select("*").execute()
        employees = response.data
        
        count = 0
        for emp in employees:
            user_id = emp['id']
            name = emp['name']
            # Supabase stores JSON, so we get a list of lists (encodings) directly
            # We need to convert them back to numpy arrays for face_recognition
            raw_encodings = emp['face_encoding'] 
            if raw_encodings:
                encodings = [np.array(e) for e in raw_encodings]
                known_faces_cache[user_id] = {
                    "name": name,
                    "encodings": encodings
                }
                count += 1
        print(f"Loaded {count} users from Supabase.")
    except Exception as e:
        print(f"Error loading from Supabase: {e}")

# Load data on startup
load_data_from_supabase()

# --- ✅ NEW: Root Health-Check Route (tidak mengganggu logika lain) ---
@app.route('/')
def health_check():
    return jsonify({
        "status": "OK",
        "service": "Face Recognition Attendance API",
        "port": 5001,
        "flask_version": flask.__version__,
        "uptime": datetime.now().isoformat(),
        "cached_users": len(known_faces_cache),
        "endpoints": [
            "POST /register",
            "POST /verify",
            "GET /stats",
            "GET /reports",
            "GET /employees",
            "GET,POST /settings",
            "WebSocket: /socket.io"
        ],
        "note": "This API does not serve a web UI. Use endpoints directly."
    }), 200

# --- HTTP Endpoints ---

@app.route('/register', methods=['POST'])
def register():
    try:
        name = request.form.get('name')
        user_id = request.form.get('id')
        
        if not name or not user_id:
            return jsonify({"success": False, "error": "Name and ID required"}), 400

        files = request.files
        if len(files) < 3:
             return jsonify({"success": False, "error": "3 photos required"}), 400

        new_encodings = []

        for key, file in files.items():
            image = face_recognition.load_image_file(file)
            encodings = face_recognition.face_encodings(image)
            
            if len(encodings) > 0:
                new_encodings.append(encodings[0])
            else:
                 return jsonify({"success": False, "error": f"No face detected in {key}"}), 400

        if len(new_encodings) < 3:
             return jsonify({"success": False, "error": "Could not detect face in all 3 photos"}), 400

        # Convert numpy arrays to lists for JSON serialization
        encodings_list = [e.tolist() for e in new_encodings]

        # 1. Save to Supabase
        data = {
            "id": user_id,
            "name": name,
            "face_encoding": encodings_list
        }
        supabase.table('employees').upsert(data).execute()

        # 2. Update Local Cache
        known_faces_cache[user_id] = {
            "name": name,
            "encodings": new_encodings
        }

        return jsonify({"success": True, "userId": user_id, "message": "User registered successfully"})

    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/verify', methods=['POST'])
def verify():
    try:
        if 'image' not in request.files:
            return jsonify({"success": False, "error": "No image provided"}), 400

        file = request.files['image']
        image = face_recognition.load_image_file(file)
        result = process_image_for_recognition(image)
        return jsonify(result)
    except Exception as e:
        print(f"Verification error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    try:
        # Get date from query param, default to today
        query_date = request.args.get('date', date.today().isoformat())
        
        # 1. Total Employees
        emp_res = supabase.table('employees').select("id", count='exact').execute()
        total_employees = emp_res.count if emp_res.count is not None else len(emp_res.data)

        # 2. Status Counts for Specific Date
        today_start = f"{query_date}T00:00:00"
        today_end = f"{query_date}T23:59:59"

        logs_res = supabase.table('attendance_logs')\
            .select("employee_id, status, timestamp, employees(name)")\
            .gte("timestamp", today_start)\
            .lte("timestamp", today_end)\
            .order("timestamp", desc=True)\
            .execute()
        
        logs = logs_res.data
        
        # Calculate Stats manually from logs to be accurate with filters
        present_employees = set()
        checked_out_employees = set()
        history = []

        for log in logs:
            emp_id = log['employee_id']
            status = log['status']
            
            # For history view (all logs for that day)
            emp_name = log['employees']['name'] if log.get('employees') else "Unknown"
            history.append({
                "name": emp_name,
                "time": log['timestamp'],
                "status": status
            })

            if status in ['Masuk', 'Terlambat', 'Hadir']:
                present_employees.add(emp_id)
            elif status == 'Pulang':
                checked_out_employees.add(emp_id)
        
        present_count = len(present_employees)
        checked_out_count = len(checked_out_employees)

        # 4. Get Current Schedule
        schedule = get_current_schedule()

        return jsonify({
            "total_employees": total_employees,
            "present_today": present_count,
            "checked_out_today": checked_out_count,
            "history": history, # Full history for the selected date
            "schedule": schedule,
            "selected_date": query_date
        })

    except Exception as e:
        print(f"Stats Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/reports', methods=['GET'])
def get_reports():
    try:
        start_date = request.args.get('start_date', date.today().isoformat())
        end_date = request.args.get('end_date', date.today().isoformat())
        
        start_ts = f"{start_date}T00:00:00"
        end_ts = f"{end_date}T23:59:59"

        logs_res = supabase.table('attendance_logs')\
            .select("*, employees(name)")\
            .gte("timestamp", start_ts)\
            .lte("timestamp", end_ts)\
            .order("timestamp", desc=True)\
            .execute()
            
        data = []
        for log in logs_res.data:
             data.append({
                "id": log['id'],
                "name": log['employees']['name'] if log.get('employees') else "Unknown",
                "employee_id": log['employee_id'],
                "timestamp": log['timestamp'],
                "status": log['status']
             })
             
        return jsonify({"success": True, "data": data})

    except Exception as e:
        print(f"Reports Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/employees', methods=['GET'])
def get_employees():
    try:
        response = supabase.table('employees').select("*").execute()
        return jsonify({"employees": response.data})
    except Exception as e:
        print(f"Error fetching employees: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/settings', methods=['GET', 'POST'])
def handle_settings():
    if request.method == 'GET':
        try:
            # Get settings (id=1)
            response = supabase.table('attendance_settings').select("*").eq('id', 1).execute()
            if response.data:
                return jsonify(response.data[0])
            else:
                # Return default if not found
                return jsonify({"start_time": "08:00", "end_time": "17:00", "late_tolerance_minutes": 15})
        except Exception as e:
            # If table doesn't exist (PGRST205), return defaults so page loads
            if 'attendance_settings' in str(e) or 'PGRST205' in str(e):
                return jsonify({"start_time": "08:00", "end_time": "17:00", "late_tolerance_minutes": 15})
            print(f"Settings GET Error: {e}")
            return jsonify({"error": str(e)}), 500

    if request.method == 'POST':
        try:
            data = request.json
            update_data = {
                "start_time": data.get("start_time"),
                "end_time": data.get("end_time"),
                "late_tolerance_minutes": int(data.get("late_tolerance_minutes", 15))
            }
            # Upsert id=1
            update_data['id'] = 1
            supabase.table('attendance_settings').upsert(update_data).execute()
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

# --- Helper Functions ---

def get_current_schedule():
    try:
        response = supabase.table('attendance_settings').select("*").eq('id', 1).execute()
        if response.data:
            return response.data[0]
        return {"start_time": "08:00", "end_time": "17:00", "late_tolerance_minutes": 15}
    except:
        return {"start_time": "08:00", "end_time": "17:00", "late_tolerance_minutes": 15}

def process_image_for_recognition(image):
    face_locations = face_recognition.face_locations(image)
    face_encodings = face_recognition.face_encodings(image, face_locations)

    if not face_encodings:
         return {"success": False, "error": "No face detected"}

    unknown_encoding = face_encodings[0]
    
    best_match_name = None
    best_match_id = None
    min_distance = 0.5 

    for user_id, data in known_faces_cache.items():
        stored_encodings = data["encodings"]
        # Use tolerance 0.5 for strict matching
        matches = face_recognition.compare_faces(stored_encodings, unknown_encoding, tolerance=0.5)
        face_distances = face_recognition.face_distance(stored_encodings, unknown_encoding)
        
        if True in matches:
            avg_distance = np.mean(face_distances)
            if avg_distance < min_distance:
                min_distance = avg_distance
                best_match_name = data["name"]
                best_match_id = user_id

    if best_match_name:
        # Debounce/Cooldown Check (e.g., 5 seconds)
        last_time = last_processed_cache.get(best_match_id)
        current_time = datetime.now()
        
        if last_time and (current_time - last_time).total_seconds() < 5:
            # Skip processing if too soon
            return {
                "success": True, 
                "user": {
                    "id": best_match_id, 
                    "name": best_match_name, 
                    "time": current_time.isoformat(), 
                    "status": "Cooldown" 
                }
            }
        
        last_processed_cache[best_match_id] = current_time

        # Check today's attendance for this user
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        
        try:
            # Fetch ALL logs for today to determine state
            response = supabase.table('attendance_logs')\
                .select("*")\
                .eq('employee_id', best_match_id)\
                .gte('timestamp', today_start)\
                .order('timestamp', desc=True)\
                .execute()
            
            logs = response.data
            
            # Determine current state
            has_check_in = any(l['status'] in ['Masuk', 'Terlambat'] for l in logs)
            has_check_out = any(l['status'] == 'Pulang' for l in logs)
            
            status = "Masuk" # Default intention
            should_insert = False
            
            schedule = get_current_schedule()
            
            if not has_check_in:
                # Rule 1: Check-in (First time only)
                should_insert = True
                
                # Check for Late
                start_time_str = schedule.get('start_time', '08:00')
                tolerance = schedule.get('late_tolerance_minutes', 15)
                
                time_parts = list(map(int, start_time_str.split(':')))
                st_hour = time_parts[0]
                st_minute = time_parts[1]
                
                schedule_start = current_time.replace(hour=st_hour, minute=st_minute, second=0, microsecond=0)
                late_threshold = schedule_start + timedelta(minutes=tolerance)
                
                if current_time.replace(tzinfo=None) > late_threshold.replace(tzinfo=None):
                    status = "Terlambat"
                else:
                    status = "Masuk"
            
            elif has_check_in and not has_check_out:
                # Rule 2: Check-out (Only after end_time)
                end_time_str = schedule.get('end_time', '17:00')
                
                # Parse end time
                et_parts = list(map(int, end_time_str.split(':')))
                et_hour = et_parts[0]
                et_minute = et_parts[1]
                
                schedule_end = current_time.replace(hour=et_hour, minute=et_minute, second=0, microsecond=0)
                
                if current_time.replace(tzinfo=None) >= schedule_end.replace(tzinfo=None):
                    status = "Pulang"
                    should_insert = True
                else:
                    # Not yet time to go home
                    status = "Belum Waktu Pulang"
                    should_insert = False
            
            else:
                # Already checked in and checked out
                status = "Sudah Pulang"
                should_insert = False

            # Use UTC for Database Storage
            utc_now = datetime.now(timezone.utc).isoformat()

            if should_insert:
                log_data = {
                    "employee_id": best_match_id,
                    "status": status,
                    "timestamp": utc_now
                }
                supabase.table('attendance_logs').insert(log_data).execute()

        except Exception as e:
            print(f"Error logging attendance: {e}")
            status = "Error"

        return {
            "success": True,
            "user": {
                "id": best_match_id,
                "name": best_match_name,
                "time": datetime.now().isoformat(),
                "status": status
            }
        }
    else:
         return {"success": False, "error": "Unknown face"}

def base64_to_image(base64_string):
    if "base64," in base64_string:
        base64_string = base64_string.split("base64,")[1]
    
    image_bytes = base64.b64decode(base64_string)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# --- WebSocket Events ---

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('process_frame')
def handle_process_frame(data):
    try:
        image = base64_to_image(data.get('image', ''))
        result = process_image_for_recognition(image)
        emit('attendance_result', result)
    except Exception as e:
        print(f"Socket processing error: {e}")
        emit('attendance_result', {"success": False, "error": "Processing error"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting Flask-SocketIO on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)