from apps.audit.models import AuditLog


class AuditRequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith("/api/") and request.method not in {"GET", "HEAD", "OPTIONS"}:
            AuditLog.objects.create(
                user=request.user if getattr(request, "user", None) and request.user.is_authenticated else None,
                method=request.method,
                path=request.path[:500],
                status_code=response.status_code,
                ip_address=request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", "")).split(",")[0] or None,
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )
        return response
