-- Run this in your Supabase SQL Editor

ALTER TABLE attendance_logs 
ADD COLUMN shift_id BIGINT REFERENCES shifts(id);

-- Optional: Update existing logs if you want to backfill (might be inaccurate if shifts changed)
-- UPDATE attendance_logs SET shift_id = (SELECT shift_id FROM employees WHERE employees.id = attendance_logs.employee_id);
