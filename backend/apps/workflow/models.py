from django.conf import settings
from django.db import models

from apps.curriculum.models import Course, TimestampedModel


class WorkflowDecision(models.TextChoices):
    REQUEST_CHANGES = "REQUEST_CHANGES", "Request changes"
    APPROVE = "APPROVE", "Approve"
    REJECT = "REJECT", "Reject"
    PUBLISH = "PUBLISH", "Publish"


class ApprovalWorkflow(TimestampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="workflows")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="workflow_actions")
    from_status = models.CharField(max_length=32)
    to_status = models.CharField(max_length=32)
    decision = models.CharField(max_length=32, choices=WorkflowDecision.choices)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]


class ReviewerComment(TimestampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="review_comments")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="review_comments")
    section_key = models.CharField(max_length=120)
    section_label = models.CharField(max_length=180)
    body = models.TextField()
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="resolved_comments")
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["section_key", "-created_at"]
        indexes = [models.Index(fields=["course", "section_key", "is_resolved"])]
