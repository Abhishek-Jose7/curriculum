from django.conf import settings
from django.db import models

from apps.curriculum.models import TimestampedModel


class Notification(TimestampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=180)
    body = models.TextField(blank=True)
    link = models.CharField(max_length=260, blank=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
