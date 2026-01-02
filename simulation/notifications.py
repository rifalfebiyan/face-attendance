from datetime import datetime

class NotificationService:
    def __init__(self):
        # In a real app, initialize Twilio Client / SendGrid / WhatsApp API
        print("NotificationService initialized.")

    def notify_employee_checkin(self, employee_name, time_str, status):
        """
        Sends a message to the employee (e.g., via WhatsApp).
        """
        message = f"Hello {employee_name}, successful check-in at {time_str}. Status: {status}."
        # Mock sending
        self._log_notification("WhatsApp", employee_name, message)

    def notify_admin_leave_request(self, employee_name, leave_type, dates):
        """
        Notifies admin about a new leave request.
        """
        message = f"New Leave Request from {employee_name} ({leave_type}) for {dates}. Please review."
        # Mock sending
        self._log_notification("Email/Admin-Bot", "HR Admin", message)
    
    def notify_admin_late_checkin(self, employee_name, minutes_late):
        """
        Notifies admin if someone is very late.
        """
        message = f"Alert: {employee_name} is late by {minutes_late} minutes."
        self._log_notification("Slack/Admin-Bot", "HR Admin", message)

    def _log_notification(self, channel, recipient, body):
        # This simulates the external API call
        print(f"\n[🔔 NOTIFICATION] Channel: {channel} | To: {recipient} | Body: {body}\n")

# Global Instance
notification_service = NotificationService()
