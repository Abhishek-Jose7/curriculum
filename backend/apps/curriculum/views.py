from django.db import transaction
from django.http import HttpResponse
from rest_framework import decorators, filters, permissions, response, status, viewsets

from apps.accounts.permissions import CourseObjectPermission, IsAdminOrHOD
from apps.curriculum.models import (
    AcademicYear,
    AssessmentScheme,
    Course,
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
    CourseVersionSerializer,
    DepartmentSerializer,
    ExperimentSerializer,
    ModuleSerializer,
    ReferenceBookSerializer,
    SemesterSerializer,
    TopicSerializer,
)
from apps.curriculum.services import create_course_version
from apps.publishing.services import render_course_preview_pdf, render_reviewer_readonly_pdf


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
        pdf = render_course_preview_pdf(course)
        return HttpResponse(pdf, content_type="application/pdf")

    @decorators.action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny])
    def reviewer_readonly_pdf(self, request, pk=None):
        course = self.get_object()
        pdf = render_reviewer_readonly_pdf(course)
        return HttpResponse(pdf, content_type="application/pdf")


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
