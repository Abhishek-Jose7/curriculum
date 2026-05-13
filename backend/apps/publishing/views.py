from rest_framework import decorators, permissions, response, viewsets

from apps.accounts.permissions import IsAdminOrHOD
from apps.curriculum.models import AcademicYear, Department
from apps.publishing.models import CurriculumTemplate, PublishedCurriculum
from apps.publishing.serializers import CurriculumTemplateSerializer, PublishedCurriculumSerializer
from apps.publishing.services import assemble_curriculum_pdf


class CurriculumTemplateViewSet(viewsets.ModelViewSet):
    queryset = CurriculumTemplate.objects.select_related("department").all()
    serializer_class = CurriculumTemplateSerializer
    permission_classes = [IsAdminOrHOD]
    filterset_fields = ["department", "is_active"]


class PublishedCurriculumViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PublishedCurriculum.objects.select_related("department", "academic_year", "template", "published_by").all()
    serializer_class = PublishedCurriculumSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ["department", "academic_year", "is_public"]

    @decorators.action(detail=False, methods=["post"], permission_classes=[IsAdminOrHOD])
    def publish(self, request):
        department = Department.objects.get(pk=request.data["department"])
        academic_year = AcademicYear.objects.get(pk=request.data["academic_year"])
        template = CurriculumTemplate.objects.get(pk=request.data["template"])
        published = assemble_curriculum_pdf(
            department,
            academic_year,
            template,
            request.user,
            request.data.get("version_label", "v1"),
        )
        return response.Response(self.get_serializer(published).data, status=201)
