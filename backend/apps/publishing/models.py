from django.conf import settings
from django.db import models

from apps.curriculum.models import AcademicYear, Department, Semester, TimestampedModel


class CurriculumTemplate(TimestampedModel):
    name = models.CharField(max_length=140)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="templates")
    html_template = models.TextField(help_text="Django template source for official PDF sections.")
    css = models.TextField(help_text="Paged media CSS matching the official university template.")
    is_active = models.BooleanField(default=True)
    is_locked = models.BooleanField(
        default=False,
        help_text="Locked after publish — prevents edits that would invalidate historical PDFs.",
    )
    version = models.PositiveIntegerField(
        default=1,
        help_text="Incremented on each edit. Published curricula store the version they used.",
    )
    template_pdf = models.FileField(upload_to="official-templates/", blank=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        locked_label = " [LOCKED]" if self.is_locked else ""
        return f"{self.name} v{self.version}{locked_label}"

    def save(self, *args, **kwargs):
        # Auto-increment version on content changes (but not on lock toggling)
        if self.pk:
            try:
                old = CurriculumTemplate.objects.get(pk=self.pk)
                content_changed = old.css != self.css or old.html_template != self.html_template
                if content_changed and not old.is_locked:
                    self.version = old.version + 1
                if old.is_locked and content_changed:
                    raise ValueError(
                        f"Template '{self.name}' is locked after publish. "
                        "Create a new template version instead of editing the locked one."
                    )
            except CurriculumTemplate.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    def create_unlocked_copy(self) -> "CurriculumTemplate":
        """Create an editable copy of a locked template for the next academic cycle."""
        return CurriculumTemplate.objects.create(
            name=f"{self.name} (Copy)",
            department=self.department,
            html_template=self.html_template,
            css=self.css,
            is_active=False,
            is_locked=False,
            version=1,
        )


class PublishedCurriculum(TimestampedModel):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="published_curricula")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="published_curricula")
    template = models.ForeignKey(CurriculumTemplate, on_delete=models.PROTECT, related_name="published_curricula")
    published_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="published_curricula")
    pdf = models.FileField(upload_to="published-curricula/")
    docx = models.FileField(upload_to="published-docx/", blank=True)
    version_label = models.CharField(max_length=80)
    is_public = models.BooleanField(default=True)
    template_snapshot = models.JSONField(
        default=dict,
        blank=True,
        help_text="Frozen copy of the template CSS and HTML at the time of publish — immutable audit record.",
    )
    render_metrics = models.JSONField(
        default=dict,
        blank=True,
        help_text="Page count, course count, overflow warnings recorded at render time.",
    )

    class Meta:
        unique_together = ("department", "academic_year", "version_label")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.department.code} {self.academic_year.name} {self.version_label}"
