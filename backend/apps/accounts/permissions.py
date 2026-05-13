from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.models import Role


class IsAdminOrHOD(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_academic_admin)


class IsReviewerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role in {Role.REVIEWER, Role.ADMIN, Role.HOD} or request.user.is_superuser)
        )


class CourseObjectPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_academic_admin:
            return True
        if request.method in SAFE_METHODS and user.role in {Role.REVIEWER, Role.FACULTY}:
            return True
        if user.role == Role.FACULTY:
            return obj.faculty_id == user.id and obj.status in {"DRAFT", "CHANGES_REQUESTED", "SUBMITTED", "UNDER_REVIEW"}
        return False
