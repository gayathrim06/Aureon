from notifications.models import Notification

class NotificationService:
    @staticmethod
    def send_notification(recipient, title, message, notification_type, priority='MEDIUM'):
        if not recipient:
            return None
        return Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority
        )
