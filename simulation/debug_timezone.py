from datetime import datetime, timedelta, timezone
import time

# Simulate the issue
local_now = datetime.now()
utc_now = datetime.now(timezone.utc)

print(f"Local Now (Naive): {local_now}")
print(f"UTC Now (Aware): {utc_now}")

# Simulate Today Start (Local) as defined in app.py
today_start_local_naive = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
print(f"Today Start (Local Naive): {today_start_local_naive}")

# Simulate Stored Log Timestamp (UTC) - e.g. 5 hours ago
# If Local is 00:50 (Jan 2), UTC might be 17:50 (Jan 1)
test_log_utc = utc_now - timedelta(minutes=30)
print(f"Test Log (UTC): {test_log_utc}")

# The comparison app.py does:
# .gte('timestamp', today_start_local_naive.isoformat())

print(f"Comparison: '{test_log_utc.isoformat()}' >= '{today_start_local_naive.isoformat()}' ?")
print(f"Result (String Compare): {test_log_utc.isoformat() >= today_start_local_naive.isoformat()}")

# Proposed Fix: Lookback 24h
lookback = (utc_now - timedelta(hours=24)).isoformat()
print(f"Lookback 24h (UTC): {lookback}")
print(f"Result (Lookback): {test_log_utc.isoformat() >= lookback}")
