from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    HOD = "HOD", "Head of Department"
    FACULTY = "FACULTY", "Faculty"
    REVIEWER = "REVIEWER", "Reviewer"
    PUBLIC = "PUBLIC", "Public Viewer"


class User(AbstractUser):
    role = models.CharField(max_length=24, choices=Role.choices, default=Role.FACULTY)
    department = models.ForeignKey(
        "curriculum.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    designation = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=32, blank=True)

    @property
    def is_academic_admin(self) -> bool:
        return self.role in {Role.ADMIN, Role.HOD} or self.is_superuser
