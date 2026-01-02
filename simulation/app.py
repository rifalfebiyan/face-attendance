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
import mediapipe as mp
from scipy.spatial import distance as dist
import pandas as pd
import io
from werkzeug.utils import secure_filename

from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# Enable CORS for HTTP
CORS(app)
# Enable SocketIO with CORS
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# --- Liveness Detection Setup ---
mp_face_mesh = mp.solutions.face_mesh
# Use a global instance or per-request? Global is better for performance but not thread-safe if processed in parallel?
# SocketIO threading mode: requests are concurrent. MediaPipe FaceMesh is not strictly thread-safe.
# However, usually we instantiate it per claim or use a lock.
# For simplicity in this demo, we can instantiate it inside the processing function or use a pool.
# Instantiating per frame is expensive.
# Let's try one global instance and see (Thread safety might be an issue, but standard GIL helps).
# Better: Create a dictionary of FaceMesh objects keyed by session ID if possible, or just one global guarded by Lock.
# Actually, let's keep it simple: Instantiate inside the session state object or just once globally and risk it (usually fine for single generic worker).

# Let's use a class to manage state per client
class ClientState:
    def __init__(self):
        self.blink_counter = 0
        self.total_blinks = 0
        self.last_blink_time = None
        self.is_live = False
        # Initialize FaceMesh per client to avoid thread conflicts and state mixups
        self.face_mesh = mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

# Global state store: { sid: ClientState }
client_states = {}

# Constants for EAR
EYE_AR_THRESH = 0.25 # Threshold below which eye is considered closed
EYE_AR_CONSEC_FRAMES = 3 # Increased to 3 to filter out noise
LIVENESS_TIMEOUT = 5.0 # Seconds liveness remains valid after a blink

# Eye Landmarks (MediaPipe)
# Left eye indices
LEFT_EYE = [362, 385, 387, 263, 373, 380]
# Right eye indices
RIGHT_EYE = [33, 160, 158, 133, 153, 144]

def calculate_ear(landmarks, indices):
    # Euclidean distance between vertical eye landmarks
    A = dist.euclidean(landmarks[indices[1]], landmarks[indices[5]])
    B = dist.euclidean(landmarks[indices[2]], landmarks[indices[4]])
    # Euclidean distance between horizontal eye landmarks
    C = dist.euclidean(landmarks[indices[0]], landmarks[indices[3]])
    # Compute EAR
    ear = (A + B) / (2.0 * C)
    return ear


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

@app.route('/login', methods=['POST'])
def login():
    try:
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            return jsonify({"success": False, "error": "Email and password required"}), 400

        # Query user from Supabase
        response = supabase.table('users').select("*").eq('email', email).execute()
        users = response.data

        if not users:
            return jsonify({"success": False, "error": "Invalid email or password"}), 401

        user = users[0]

        # Verify password (Plain text for prototype as per SQL seed)
        # TODO: Use werkzeug.security.check_password_hash in production
        if user['password'] != password:
            return jsonify({"success": False, "error": "Invalid email or password"}), 401

        # Generate simple token (or just return success for frontend cookie)
        # In a real app, generate JWT here.
        return jsonify({
            "success": True, 
            "token": f"user_{user['id']}_{int(datetime.now().timestamp())}", 
            "user": {
                "id": user['id'],
                "email": user['email'],
                "name": user['name'],
                "role": user.get('role', 'admin')  # Return role
            }
        })

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


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

        # Join with employees AND shifts (directly linked to log now)
        logs_res = supabase.table('attendance_logs')\
            .select("*, employees(name), shifts(name, start_time, end_time)")\
            .gte("timestamp", start_ts)\
            .lte("timestamp", end_ts)\
            .order("timestamp", desc=True)\
            .execute()
            
        data = []
        for log in logs_res.data:
             emp = log.get('employees', {})
             
             # Priority: Shift logged in attendance > Shift currently assigned to employee
             log_shift = log.get('shifts') # relation: attendance_logs.shift_id -> shifts.id
             
             if log_shift:
                 shift_name = f"{log_shift.get('name')} ({log_shift.get('start_time')}-{log_shift.get('end_time')})"
             else:
                 # Fallback for old logs (before we added shift_id)
                 emp_shift = emp.get('shifts') if emp and isinstance(emp, dict) and 'shifts' in emp else None
                 if emp_shift:
                      shift_name = f"{emp_shift.get('name')} ({emp_shift.get('start_time')}-{emp_shift.get('end_time')}) (Current)"
                 else:
                      shift_name = "No Shift"

             data.append({
                "id": log['id'],
                "name": emp.get('name', 'Unknown') if emp else 'Unknown',
                "employee_id": log['employee_id'],
                "timestamp": log['timestamp'],
                "status": log['status'],
                "shift": shift_name
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

@app.route('/employees/<id>/shift', methods=['PUT'])
def update_employee_shift(id):
    try:
        data = request.json
        shift_id = data.get('shift_id')
        # Convert empty string to None
        value = int(shift_id) if shift_id else None
        
        supabase.table('employees').update({"shift_id": value}).eq('id', id).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/employees/<id>', methods=['DELETE'])
def delete_employee(id):
    try:
        # 1. Delete from Supabase
        response = supabase.table('employees').delete().eq('id', id).execute()
        
        # 2. Remove from Local Cache
        if id in known_faces_cache:
            del known_faces_cache[id]
            print(f"Removed user {id} from cache.")

        return jsonify({"success": True, "message": f"User {id} deleted successfully"})
    except Exception as e:
        print(f"Error deleting employee: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

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

# --- NEW: Shifts Management ---
@app.route('/shifts', methods=['GET', 'POST'])
def handle_shifts():
    if request.method == 'GET':
        try:
            res = supabase.table('shifts').select("*").order('id').execute()
            return jsonify({"success": True, "data": res.data})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    if request.method == 'POST':
        try:
            data = request.json
            shift = {
                "name": data.get("name"),
                "start_time": data.get("start_time"),
                "end_time": data.get("end_time"),
                "late_tolerance_minutes": int(data.get("late_tolerance_minutes", 15))
            }
            if 'id' in data: # Update
                 supabase.table('shifts').update(shift).eq('id', data['id']).execute()
            else: # Insert
                 supabase.table('shifts').insert(shift).execute()
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

@app.route('/shifts/<id>', methods=['DELETE'])
def delete_shift(id):
    try:
        supabase.table('shifts').delete().eq('id', id).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# --- NEW: Leaves Management ---
@app.route('/leaves', methods=['GET', 'POST'])
def handle_leaves():
    if request.method == 'GET':
        try:
            # Join with employees to get names
            res = supabase.table('leaves').select("*, employees(name)").order('created_at', desc=True).execute()
            
            # Flatten structure for frontend
            leaves = []
            for l in res.data:
                l['employee_name'] = l['employees']['name'] if l.get('employees') else 'Unknown'
                del l['employees']
                leaves.append(l)
                
            return jsonify({"success": True, "data": leaves})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    if request.method == 'POST':
        try:
            data = request.json
            leave = {
                "employee_id": data.get("employee_id"),
                "type": data.get("type"),
                "start_date": data.get("start_date"),
                "end_date": data.get("end_date"),
                "reason": data.get("reason"),
                "status": "Pending"
            }
            supabase.table('leaves').insert(leave).execute()
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

@app.route('/leaves/<id>', methods=['PUT', 'DELETE'])
def update_leave(id):
    try:
        if request.method == 'DELETE':
             supabase.table('leaves').delete().eq('id', id).execute()
             return jsonify({"success": True})
        
        # PUT (Update Status)
        data = request.json
        supabase.table('leaves').update({"status": data.get("status")}).eq('id', id).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# --- NEW: Manual Attendance ---
@app.route('/attendance/manual', methods=['POST'])
def manual_attendance():
    try:
        data = request.json
        employee_id = data.get("employee_id")
        timestamp = data.get("timestamp") # ISO string
        status = data.get("status")
        
        # 1. Fetch current shift_id of the employee
        emp_res = supabase.table('employees').select('shift_id').eq('id', employee_id).execute()
        shift_id = emp_res.data[0]['shift_id'] if emp_res.data else None

        # 2. Insert log with shift_id
        log = {
            "employee_id": employee_id,
            "timestamp": timestamp,
            "status": status,
            "shift_id": shift_id, # Store historical shift
            "confidence_score": 1.0
        }
        supabase.table('attendance_logs').insert(log).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# --- NEW: Export Excel ---
@app.route('/reports/export', methods=['GET'])
def export_reports():
    try:
        start_date = request.args.get('start_date', date.today().isoformat())
        end_date = request.args.get('end_date', date.today().isoformat())
        
        start_ts = f"{start_date}T00:00:00"
        end_ts = f"{end_date}T23:59:59"

        # Fetch data
        logs_res = supabase.table('attendance_logs')\
            .select("timestamp, status, employees(name, id)")\
            .gte("timestamp", start_ts)\
            .lte("timestamp", end_ts)\
            .order("timestamp", desc=True)\
            .execute()
        
        data = []
        for log in logs_res.data:
            data.append({
                "Tanggal": log['timestamp'][:10],
                "Jam": log['timestamp'][11:19],
                "Nama Karyawan": log['employees']['name'] if log.get('employees') else "Unknown",
                "ID Karyawan": log['employees']['id'] if log.get('employees') else log.get('employee_id'),
                "Status": log['status']
            })
            
        df = pd.DataFrame(data)
        
        # Generate Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Presensi')
        
        output.seek(0)
        
        return flask.send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'Laporan_Presensi_{start_date}_{end_date}.xlsx'
        )
            
    except Exception as e:
        print(f"Export Error: {e}")
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

def process_image_for_recognition(image, sid=None):
    # 0. Get Client State
    state = None
    if sid:
        if sid not in client_states:
            client_states[sid] = ClientState()
        state = client_states[sid]

    liveness_status = "Unknown"
    
    # 1. Liveness Detection (MediaPipe)
    if state:
        # Check if liveness is still valid
        if state.last_blink_time and (datetime.now() - state.last_blink_time).total_seconds() < LIVENESS_TIMEOUT:
            state.is_live = True
        else:
            state.is_live = False

        # Process frame for blinks
        # MediaPipe needs RGB (already converted)
        results = state.face_mesh.process(image)
        
        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                # Convert landmarks to numpy array for easier indexing if needed, 
                # but we can access .x .y directly.
                # However, calculate_ear uses indices on a list of (x,y) tuples usually.
                # Let's extract coords.
                h, w, _ = image.shape
                landmarks = [(lm.x * w, lm.y * h) for lm in face_landmarks.landmark]
                
                leftEAR = calculate_ear(landmarks, LEFT_EYE)
                rightEAR = calculate_ear(landmarks, RIGHT_EYE)
                ear = (leftEAR + rightEAR) / 2.0
                # print(f"EAR: {ear:.2f} | Count: {state.blink_counter}") # Debug EAR
                
                if ear < EYE_AR_THRESH:
                    state.blink_counter += 1
                else:
                    if state.blink_counter >= EYE_AR_CONSEC_FRAMES:
                        state.total_blinks += 1
                        state.last_blink_time = datetime.now()
                        state.is_live = True # Liveness confirmed!
                        print(f"Blink detected! Total: {state.total_blinks}")
                    state.blink_counter = 0
        
        liveness_status = "Live" if state.is_live else "Spoof/Photo - Please Blink"

    # If NOT live, we can choose to return early or return a specific status
    # To secure it: strictly block recognition if not live.
    if state and not state.is_live:
         return {
            "success": False, 
            "error": "Liveness Check Failed",
            "message": "Silakan berkedip untuk verifikasi.",
            "is_live": False
        }

    # 2. Face Recognition (dlib)
    # Only proceed if live
    
    face_locations = face_recognition.face_locations(image)
    face_encodings = face_recognition.face_encodings(image, face_locations)

    if not face_encodings:
         return {"success": False, "error": "No face detected", "is_live": state.is_live if state else False}

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
                },
                "is_live": True
            }
        
        last_processed_cache[best_match_id] = current_time

        # Check recent attendance for this user (Lookback 20 hours to cover night shifts/timezone diffs)
        lookback_time = (datetime.now(timezone.utc) - timedelta(hours=20)).isoformat()
        
        try:
            # Fetch logs for the last 20 hours
            response = supabase.table('attendance_logs')\
                .select("*")\
                .eq('employee_id', best_match_id)\
                .gte('timestamp', lookback_time)\
                .order('timestamp', desc=True)\
                .execute()
            
            logs = response.data
            
            # Determine current state based on LATEST log
            # If latest log is 'Masuk' or 'Terlambat', then we are currently checked in.
            # If latest log is 'Pulang' or empty, we are checked out.
            
            if logs:
                latest_status = logs[0]['status']
                has_check_in = latest_status in ['Masuk', 'Terlambat']
                has_check_out = latest_status == 'Pulang' # Or arguably, if latest is Pulang, has_check_in is False for *new* session
            else:
                has_check_in = False
                has_check_out = False
                
            # Refined Logic:
            # If last log was "Masuk/Terlambat", we are IN -> Next action: Pulang
            # If last log was "Pulang", we are OUT -> Next action: Masuk
            
            status = "Masuk" # Default intention
            should_insert = False
            
            schedule = get_current_schedule()
            
            # Fetch employee specific shift (moved up to be available for both IN/OUT and logging)
            emp_shift_res = supabase.table('employees').select('shifts(*)').eq('id', best_match_id).single().execute()
            emp_shift = emp_shift_res.data.get('shifts') if emp_shift_res.data else None
            
            current_shift_id = emp_shift.get('id') if emp_shift else None
            current_schedule = emp_shift if emp_shift else schedule

            if not has_check_in:
                # Rule 1: Check-in (First time only)
                should_insert = True
                
                start_time_str = current_schedule.get('start_time', '08:00')
                tolerance = current_schedule.get('late_tolerance_minutes', 15)
                
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
                # Use current_schedule (which respects employee shift) instead of global schedule
                end_time_str = current_schedule.get('end_time', '17:00')
                
                # Parse end time
                et_parts = list(map(int, end_time_str.split(':')))
                et_hour = et_parts[0]
                et_minute = et_parts[1]
                
                schedule_end = current_time.replace(hour=et_hour, minute=et_minute, second=0, microsecond=0)
                
                if current_time.replace(tzinfo=None) >= schedule_end.replace(tzinfo=None):
                    status = "Pulang"
                    should_insert = True
                else:
                    # Early Departure Logic
                    # CHECK 1: Prevent "Pulang" if before Shift Start (e.g. scanned Masuk early, then scanned again)
                    schedule_start_dt = schedule_start.replace(tzinfo=None)
                    if current_time.replace(tzinfo=None) < schedule_start_dt:
                        status = "Sudah Presensi Masuk"
                        should_insert = False
                    else:
                        # CHECK 2: Prevent Accidental Double Scan (Minimum 10 mins shift duration)
                        # Ensure we don't checkout immediately after checkin
                        last_in_time_str = logs[0]['timestamp'] if logs else None
                        
                        can_checkout = True
                        if last_in_time_str:
                             last_in = datetime.fromisoformat(last_in_time_str.replace("Z", "+00:00"))
                             # Compare using UTC
                             if (datetime.now(timezone.utc) - last_in).total_seconds() < 600: # 10 minutes
                                 can_checkout = False
                        
                        if can_checkout:
                            status = "Pulang" # Allow early checkout if > 10 mins
                            should_insert = True
                        else:
                            status = "Sudah Presensi Masuk (Barusan)"
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
                    "timestamp": utc_now,
                    "shift_id": current_shift_id # Store historical shift
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
            },
            "is_live": True
        }
    else:
         return {"success": False, "error": "Unknown face", "is_live": True}

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
    sid = request.sid
    print(f'Client connected: {sid}')
    # Initialize state
    client_states[sid] = ClientState()

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    print(f'Client disconnected: {sid}')
    # Clean up
    if sid in client_states:
        del client_states[sid]

@socketio.on('process_frame')
def handle_process_frame(data):
    try:
        sid = request.sid
        image = base64_to_image(data.get('image', ''))
        # Pass SID to use process-state
        result = process_image_for_recognition(image, sid=sid)
        emit('attendance_result', result)
    except Exception as e:
        print(f"Socket processing error: {e}")
        emit('attendance_result', {"success": False, "error": "Processing error"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting Flask-SocketIO on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)