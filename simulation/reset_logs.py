from supabase import create_client
from datetime import date

SUPABASE_URL = "https://nmiwdhrivuolmnddwcge.supabase.co"
SUPABASE_KEY = "sb_publishable_9536nM2zv2xK01gLQ0Dtlw_3CZ7PqD4"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

today = date.today().isoformat()
print(f"Clearing logs for {today}...")

try:
    supabase.table('attendance_logs').delete().gte('timestamp', f"{today}T00:00:00").execute()
    print("Logs cleared successfully!")
except Exception as e:
    print(f"Error: {e}")
