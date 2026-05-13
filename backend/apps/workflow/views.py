from django.utils import timezone
from rest_framework import decorators, permissions, response, viewsets

from apps.accounts.permissions import IsReviewerOrAdmin
from apps.curriculum.models import Course
from apps.workflow.models import ApprovalWorkflow, ReviewerComment
from apps.workflow.serializers import ApprovalWorkflowSerializer, ReviewerCommentSerializer
from apps.workflow.services import apply_decision


class ApprovalWorkflowViewSet(viewsets.ModelViewSet):
    queryset = ApprovalWorkflow.objects.select_related("course", "actor").all()
    serializer_class = ApprovalWorkflowSerializer
    permission_classes = [IsReviewerOrAdmin]
    filterset_fields = ["course", "decision", "actor"]

    def create(self, request, *args, **kwargs):
        course = Course.objects.get(pk=request.data["course"])
        workflow = apply_decision(course, request.user, request.data["decision"], request.data.get("note", ""))
        return response.Response(self.get_serializer(workflow).data, status=201)


class ReviewerCommentViewSet(viewsets.ModelViewSet):
    queryset = ReviewerComment.objects.select_related("course", "reviewer", "resolved_by").all()
    serializer_class = ReviewerCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["course", "section_key", "is_resolved"]
    search_fields = ["body", "section_label"]

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)

    @decorators.action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        comment = self.get_object()
        comment.is_resolved = True
        comment.resolved_by = request.user
        comment.resolved_at = timezone.now()
        comment.save(update_fields=["is_resolved", "resolved_by", "resolved_at", "updated_at"])
        return response.Response(self.get_serializer(comment).data)
