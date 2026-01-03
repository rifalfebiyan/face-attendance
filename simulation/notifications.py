import requests
import json
from datetime import datetime

class NotificationService:
    def __init__(self):
        # Gateway URL (Node.js service)
        self.gateway_url = "http://localhost:3002/send"
        print("✅ NotificationService ready (Targeting WhatsApp Gateway)")

    def _send_whatsapp(self, number, message):
        try:
            payload = {
                "number": number,
                "message": message
            }
            # Timeout increased to handle getNumberId latency
            requests.post(self.gateway_url, json=payload, timeout=10)
            print(f"✅ WA Sent to {number}")
        except Exception as e:
            print(f"⚠️ Failed to send WA (Gateway might be down): {e}")

    def notify_employee_checkin(self, employee_name, time_str, status, number):
        # Format: 628xxx (Indonesia)
        if not number:
             return
             
        # Clean number (ensure no + or spaces if using wa gateway, but gateway handles +)
        target_number = number
        
        msg = f"*Check-in Berhasil* ✅\n\nNama: {employee_name}\nJam: {time_str}\nStatus: {status}\n\n_Sent by WarunkDigital AI_"
        self._send_whatsapp(target_number, msg)

    def notify_admin_leave_request(self, employee_name, leave_type, dates):
        target_number = "628978643225" # Admin's Number
        
        msg = f"📩 *Pengajuan Cuti Baru*\n\nNama: {employee_name}\nJenis: {leave_type}\nTanggal: {dates}\n\nMohon review di dashboard."
        self._send_whatsapp(target_number, msg)
    
    def notify_admin_late_checkin(self, employee_name, minutes_late):
        target_number = "628978643225" # Admin's Number
        
        msg = f"⚠️ *Terlambat Check-in*\n\nNama: {employee_name}\nTerlambat: {minutes_late} Menit\n\nMohon diperhatikan."
        self._send_whatsapp(target_number, msg)

    def notify_shift_change(self, employee_name, new_shift_name, start_time, end_time, number):
        if not number: return
        
        msg = f"🔄 *Perubahan Jadwal Shift*\n\nHalo {employee_name},\nShift Anda telah diubah menjadi:\n\n*Shift*: {new_shift_name}\n*Jam*: {start_time} - {end_time}\n\nSilakan cek jadwal terbaru."
        self._send_whatsapp(number, msg)

    def notify_registration_success(self, employee_name, number):
        if not number: return
        
        msg = f"🎉 *Registrasi Berhasil*\n\nSelamat {employee_name}, data wajah Anda telah berhasil didaftarkan di sistem FaceAttendance.\n\nAnda sekarang dapat melakukan presensi menggunakan wajah.\nTerima kasih."
        self._send_whatsapp(number, msg)

# Global Instance
notification_service = NotificationService()
