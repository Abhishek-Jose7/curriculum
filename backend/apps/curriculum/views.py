from django.db import transaction
from django.http import HttpResponse
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import decorators, filters, permissions, response, status, viewsets

from apps.accounts.permissions import CourseObjectPermission, IsAdminOrHOD
from apps.curriculum.models import (
    AcademicYear,
    AssessmentScheme,
    Course,
    CourseInvitation,
    CourseOutcome,
    CourseStatus,
    CourseVersion,
    Department,
    Experiment,
    Module,
    ReferenceBook,
    Semester,
    Topic,
)
from apps.curriculum.selectors import course_with_document_parts
from apps.curriculum.serializers import (
    AcademicYearSerializer,
    AssessmentSchemeSerializer,
    CourseOutcomeSerializer,
    CourseSerializer,
    CourseInvitationSerializer,
    CourseVersionSerializer,
    DepartmentSerializer,
    ExperimentSerializer,
    ModuleSerializer,
    ReferenceBookSerializer,
    SemesterSerializer,
    TopicSerializer,
)
from apps.curriculum.services import create_course_version
from apps.publishing.services import PdfOverflowError, render_course_preview_pdf, render_reviewer_readonly_pdf


class AdminWriteMixin:
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrHOD()]


class DepartmentViewSet(AdminWriteMixin, viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by("code")
    serializer_class = DepartmentSerializer
    search_fields = ["code", "name"]


class AcademicYearViewSet(AdminWriteMixin, viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all().order_by("-starts_on")
    serializer_class = AcademicYearSerializer
    search_fields = ["name"]


class SemesterViewSet(AdminWriteMixin, viewsets.ModelViewSet):
    queryset = Semester.objects.select_related("department", "academic_year").all()
    serializer_class = SemesterSerializer
    filterset_fields = ["department", "academic_year", "number"]
    search_fields = ["title", "department__name", "department__code"]


class CourseViewSet(viewsets.ModelViewSet):
    queryset = course_with_document_parts()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated, CourseObjectPermission]
    filterset_fields = ["semester", "faculty", "course_type", "status"]
    search_fields = ["code", "title", "objectives"]
    ordering_fields = ["code", "title", "status", "updated_at"]

    def perform_create(self, serializer):
        course = serializer.save()
        create_course_version(course, self.request.user, "Course created")

    def perform_update(self, serializer):
        course = serializer.save()
        create_course_version(course, self.request.user, self.request.data.get("change_summary", "Course updated"))

    @decorators.action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        course = self.get_object()
        course.status = CourseStatus.SUBMITTED
        course.save(update_fields=["status", "updated_at"])
        create_course_version(course, request.user, "Submitted for review")
        return response.Response(self.get_serializer(course).data)

    @decorators.action(detail=True, methods=["post"], permission_classes=[IsAdminOrHOD])
    def reopen(self, request, pk=None):
        course = self.get_object()
        course.status = CourseStatus.CHANGES_REQUESTED
        course.approved_by = None
        course.approved_at = None
        course.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])
        create_course_version(course, request.user, "Reopened by administrator")
        return response.Response(self.get_serializer(course).data)

    @decorators.action(detail=True, methods=["get"])
    def versions(self, request, pk=None):
        course = self.get_object()
        return response.Response(CourseVersionSerializer(course.versions.all(), many=True).data)

    @decorators.action(detail=True, methods=["post"], permission_classes=[IsAdminOrHOD])
    def rollback(self, request, pk=None):
        course = self.get_object()
        version = CourseVersion.objects.get(course=course, pk=request.data["version_id"])
        course_data = version.snapshot["course"]
        protected = {"id", "semester", "created_at", "updated_at"}
        for field, value in course_data.items():
            if field not in protected:
                setattr(course, field, value)
        course.save()
        create_course_version(course, request.user, f"Rolled back to version {version.version_number}")
        return response.Response(self.get_serializer(course).data)

    @decorators.action(detail=True, methods=["post"])
    def autosave(self, request, pk=None):
        course = self.get_object()
        serializer = self.get_serializer(course, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response({"status": "saved", "course": serializer.data})

    @decorators.action(detail=True, methods=["get"])
    def preview_pdf(self, request, pk=None):
        course = self.get_object()
        try:
            pdf = render_course_preview_pdf(course)
        except PdfOverflowError as exc:
            return response.Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        return HttpResponse(pdf, content_type="application/pdf")

    @decorators.action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny])
    def reviewer_readonly_pdf(self, request, pk=None):
        course = self.get_object()
        pdf = render_reviewer_readonly_pdf(course)
        return HttpResponse(pdf, content_type="application/pdf")

    @decorators.action(detail=True, methods=["post"], permission_classes=[IsAdminOrHOD])
    def invite_teacher(self, request, pk=None):
        course = self.get_object()
        email = request.data.get("email", "").strip().lower()
        if not email:
            return response.Response({"email": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        invitation = CourseInvitation.objects.create(course=course, email=email, invited_by=request.user)
        invitation_url = f"{settings.FRONTEND_URL}/invite/{invitation.token}"
        send_mail(
            subject=f"Curriculum editing invitation: {course.code} {course.title}",
            message=(
                f"You have been invited to edit the curriculum for {course.code} - {course.title}.\n\n"
                f"Open this subject link: {invitation_url}\n\n"
                "Use your faculty account to accept the invitation. This link is subject-specific and read/write access is limited to the assigned course."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return response.Response(CourseInvitationSerializer(invitation, context={"request": request}).data, status=201)


class CourseInvitationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CourseInvitation.objects.select_related("course", "course__semester", "invited_by", "accepted_by").all()
    serializer_class = CourseInvitationSerializer
    lookup_field = "token"

    def get_permissions(self):
        if self.action in {"retrieve", "accept"}:
            return [permissions.AllowAny()]
        return [IsAdminOrHOD()]

    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, token=None):
        invitation = self.get_object()
        if invitation.is_expired:
            return response.Response({"detail": "Invitation link has expired."}, status=status.HTTP_400_BAD_REQUEST)
        if invitation.is_accepted:
            return response.Response({"detail": "Invitation has already been accepted."}, status=status.HTTP_400_BAD_REQUEST)
        course = invitation.course
        course.faculty = request.user
        course.save(update_fields=["faculty", "updated_at"])
        invitation.accepted_by = request.user
        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=["accepted_by", "accepted_at", "updated_at"])
        return response.Response(CourseInvitationSerializer(invitation, context={"request": request}).data)


class CourseOutcomeViewSet(viewsets.ModelViewSet):
    queryset = CourseOutcome.objects.select_related("course").all()
    serializer_class = CourseOutcomeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["course"]

    def perform_create(self, serializer):
        with transaction.atomic():
            item = serializer.save()
            create_course_version(item.course, self.request.user, "Course outcome added")


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.select_related("course").prefetch_related("topics").all()
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["course"]


class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.select_related("module", "module__course").all()
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["module"]


class ExperimentViewSet(viewsets.ModelViewSet):
    queryset = Experiment.objects.select_related("course").all()
    serializer_class = ExperimentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["course"]


class AssessmentSchemeViewSet(viewsets.ModelViewSet):
    queryset = AssessmentScheme.objects.select_related("course").all()
    serializer_class = AssessmentSchemeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["course"]


class ReferenceBookViewSet(viewsets.ModelViewSet):
    queryset = ReferenceBook.objects.select_related("course").all()
    serializer_class = ReferenceBookSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["course", "is_textbook"]
