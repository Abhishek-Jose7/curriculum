import uuid
from datetime import timedelta

from django.conf import settings
from django.core.validators import MaxLengthValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Department(TimestampedModel):
    code = models.CharField(max_length=16, unique=True)
    name = models.CharField(max_length=180)
    college_name = models.CharField(max_length=220, blank=True)
    university_name = models.CharField(max_length=220, blank=True)
    logo = models.ImageField(upload_to="department-logos/", blank=True)

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class AcademicYear(TimestampedModel):
    name = models.CharField(max_length=32, unique=True)
    starts_on = models.DateField()
    ends_on = models.DateField()
    is_active = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.name


class Semester(TimestampedModel):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="semesters")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name="semesters")
    number = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    title = models.CharField(max_length=120)
    ordinance = models.CharField(max_length=80, blank=True)

    @property
    def total_lecture_hours(self) -> int:
        return sum(c.lecture_hours for c in self.courses.all())

    @property
    def total_tutorial_hours(self) -> int:
        return sum(c.tutorial_hours for c in self.courses.all())

    @property
    def total_practical_hours(self) -> int:
        return sum(c.practical_hours for c in self.courses.all())

    @property
    def total_lecture_credits(self) -> int:
        return sum(c.lecture_credits for c in self.courses.all())

    @property
    def total_tutorial_credits(self) -> int:
        return sum(c.tutorial_credits for c in self.courses.all())

    @property
    def total_practical_credits(self) -> int:
        return sum(c.practical_credits for c in self.courses.all())

    @property
    def total_semester_credits(self) -> float:
        return float(sum(c.credits for c in self.courses.all()))

    @property
    def total_semester_marks(self) -> int:
        return sum(c.exam_total_marks for c in self.courses.all())

    class Meta:
        unique_together = ("department", "academic_year", "number")
        ordering = ["academic_year__starts_on", "department__code", "number"]

    def __str__(self) -> str:
        return f"{self.department.code} {self.academic_year.name} Sem {self.number}"


class CourseType(models.TextChoices):
    THEORY = "THEORY", "Theory"
    LAB = "LAB", "Laboratory"
    THEORY_LAB = "THEORY_LAB", "Theory and Practical"
    PROJECT = "PROJECT", "Project"
    ELECTIVE = "ELECTIVE", "Elective"
    INTERDISCIPLINARY = "INTERDISCIPLINARY", "Interdisciplinary"


class CourseStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under review"
    CHANGES_REQUESTED = "CHANGES_REQUESTED", "Changes requested"
    APPROVED = "APPROVED", "Approved"
    PUBLISHED = "PUBLISHED", "Published"
    LOCKED = "LOCKED", "Locked"


class Course(TimestampedModel):
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="courses")
    faculty = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_courses")
    code = models.CharField(max_length=32)
    title = models.CharField(max_length=220)
    course_type = models.CharField(max_length=32, choices=CourseType.choices, default=CourseType.THEORY)
    status = models.CharField(max_length=32, choices=CourseStatus.choices, default=CourseStatus.DRAFT)
    lecture_hours = models.PositiveSmallIntegerField(default=0)
    tutorial_hours = models.PositiveSmallIntegerField(default=0)
    practical_hours = models.PositiveSmallIntegerField(default=0)
    lecture_credits = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    tutorial_credits = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    practical_credits = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    credits = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    internal_marks = models.PositiveSmallIntegerField(default=0)
    external_marks = models.PositiveSmallIntegerField(default=0)
    duration_hours = models.DecimalField(max_digits=3, decimal_places=1, default=3)
    pre_requisites = models.TextField(blank=True, validators=[MaxLengthValidator(300)])
    objectives = models.TextField(blank=True, validators=[MaxLengthValidator(300)])
    syllabus_intro = models.TextField(blank=True, validators=[MaxLengthValidator(800)])
    online_resources = models.JSONField(default=list, blank=True)
    section_order = models.JSONField(default=list, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_courses")
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("semester", "code")
        ordering = ["semester__number", "code"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["course_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.code} {self.title}"

    @property
    def total_marks(self) -> int:
        return self.internal_marks + self.external_marks

    @property
    def total_marks(self) -> int:
        return self.internal_marks + self.external_marks

    @property
    def exam_theory_ise1(self) -> int:
        return min(self.internal_marks, 20)

    @property
    def exam_theory_ise2(self) -> int:
        return max(min(self.internal_marks - self.exam_theory_ise1, 20), 0)

    @property
    def exam_theory_mse(self) -> int:
        return 0

    @property
    def exam_theory_ese(self) -> int:
        return self.external_marks

    @property
    def exam_lab_ise1(self) -> int:
        return 25 if self.practical_hours or self.course_type == "LAB" else 0

    @property
    def exam_lab_ise2(self) -> int:
        return 25 if self.practical_hours or self.course_type == "LAB" else 0

    @property
    def exam_total_marks(self) -> int:
        theory = self.exam_theory_ise1 + self.exam_theory_ise2 + self.exam_theory_mse + self.exam_theory_ese
        lab = self.exam_lab_ise1 + self.exam_lab_ise2
        return theory + lab


class CourseOutcome(TimestampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="outcomes")
    code = models.CharField(max_length=16)
    description = models.TextField()
    bloom_level = models.CharField(max_length=80, blank=True)
    order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        unique_together = ("course", "code")
        ordering = ["order", "code"]


class Module(TimestampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")
    number = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=220)
    contact_hours = models.PositiveSmallIntegerField(default=0)
    content = models.TextField(validators=[MaxLengthValidator(500)])

    class Meta:
        unique_together = ("course", "number")
        ordering = ["number"]


class Topic(TimestampedModel):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="topics")
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True, validators=[MaxLengthValidator(500)])
    order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["order"]


class Experiment(TimestampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="experiments")
    number = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    hours = models.PositiveSmallIntegerField(default=2)

    class Meta:
        unique_together = ("course", "number")
        ordering = ["number"]


class AssessmentScheme(TimestampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="assessments")
    component = models.CharField(max_length=120)
    marks = models.PositiveSmallIntegerField()
    description = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["order"]


class ReferenceBook(TimestampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="reference_books")
    title = models.CharField(max_length=260)
    authors = models.CharField(max_length=260, blank=True)
    publisher = models.CharField(max_length=180, blank=True)
    edition = models.CharField(max_length=80, blank=True)
    year = models.CharField(max_length=16, blank=True)
    is_textbook = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["is_textbook", "order"]


class CourseVersion(TimestampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="versions")
    version_number = models.PositiveIntegerField()
    edited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="course_versions")
    previous_version = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True)
    snapshot = models.JSONField()
    change_summary = models.CharField(max_length=260, blank=True)

    class Meta:
        unique_together = ("course", "version_number")
        ordering = ["-version_number"]


def default_invitation_expiry():
    return timezone.now() + timedelta(days=14)


class CourseInvitation(TimestampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="invitations")
    email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="sent_course_invitations")
    accepted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="accepted_course_invitations")
    expires_at = models.DateTimeField(default=default_invitation_expiry)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["email"]), models.Index(fields=["token"])]

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    @property
    def is_accepted(self) -> bool:
        return self.accepted_at is not None
