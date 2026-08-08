import logging
from audit_logs.models import AuditLog

logger = logging.getLogger(__name__)

class AuditLogMiddleware:
    """
    Middleware that automatically records API access and mutating actions for audit trails.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Log state-changing REST API requests or auth routes
        if request.path.startswith('/api/v1/') and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            user = request.user if request.user.is_authenticated else None
            ip = self.get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            action = f"{request.method}_{request.path.strip('/').split('/')[-1].upper()}"

            try:
                AuditLog.objects.create(
                    user=user,
                    user_email=user.email if user else 'Anonymous',
                    role_name=user.role.name if user and user.role else 'Unauthenticated',
                    ip_address=ip,
                    user_agent=user_agent[:255],
                    action=action,
                    resource=request.path[:255],
                    status='SUCCESS' if response.status_code < 400 else 'FAILURE'
                )
            except Exception as e:
                logger.error(f"Audit log recording error: {str(e)}")

        return response

    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
