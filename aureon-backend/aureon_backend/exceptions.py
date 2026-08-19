import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Centralized API exception handler that formats errors consistently.
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "success": False,
            "status_code": response.status_code,
            "error_type": exc.__class__.__name__,
            "detail": response.data if isinstance(response.data, (dict, list)) else str(response.data)
        }
        response.data = custom_data
    else:
        logger.exception(f"Unhandled Exception: {str(exc)}", exc_info=exc)
        response = Response(
            {
                "success": False,
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "error_type": "InternalServerError",
                "detail": "An unexpected error occurred on the server. Please contact system administrator."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
