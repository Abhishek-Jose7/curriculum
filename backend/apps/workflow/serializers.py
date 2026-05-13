from rest_framework import serializers

from apps.workflow.models import ApprovalWorkflow, ReviewerComment


class ApprovalWorkflowSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.get_full_name", read_only=True)

    class Meta:
        model = ApprovalWorkflow
        fields = "__all__"
        read_only_fields = ["actor", "from_status", "to_status"]


class ReviewerCommentSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.get_full_name", read_only=True)

    class Meta:
        model = ReviewerComment
        fields = "__all__"
        read_only_fields = ["reviewer", "resolved_by", "resolved_at"]
