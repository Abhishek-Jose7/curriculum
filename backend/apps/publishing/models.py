from django.conf import settings
from django.db import models

from apps.curriculum.models import AcademicYear, Department, Semester, TimestampedModel


class CurriculumTemplate(TimestampedModel):
    name = models.CharField(max_length=140)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="templates")
    html_template = models.TextField(help_text="Django template source for official PDF sections.")
    css = models.TextField(help_text="Paged media CSS matching the official university template.")
    is_active = models.BooleanField(default=True)
    template_pdf = models.FileField(upload_to="official-templates/", blank=True)

    def __str__(self) -> str:
        return self.name


class PublishedCurriculum(TimestampedModel):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="published_curricula")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="published_curricula")
    template = models.ForeignKey(CurriculumTemplate, on_delete=models.PROTECT, related_name="published_curricula")
    published_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="published_curricula")
    pdf = models.FileField(upload_to="published-curricula/")
    docx = models.FileField(upload_to="published-docx/", blank=True)
    version_label = models.CharField(max_length=80)
    is_public = models.BooleanField(default=True)

    class Meta:
        unique_together = ("department", "academic_year", "version_label")
        ordering = ["-created_at"]
