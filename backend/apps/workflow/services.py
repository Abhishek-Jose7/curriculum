from django.utils import timezone

from apps.curriculum.models import Course, CourseStatus
from apps.curriculum.services import create_course_version
from apps.workflow.models import ApprovalWorkflow, WorkflowDecision


TRANSITIONS = {
    WorkflowDecision.REQUEST_CHANGES: CourseStatus.CHANGES_REQUESTED,
    WorkflowDecision.APPROVE: CourseStatus.APPROVED,
    WorkflowDecision.REJECT: CourseStatus.CHANGES_REQUESTED,
    WorkflowDecision.PUBLISH: CourseStatus.PUBLISHED,
}


def apply_decision(course: Course, actor, decision: str, note: str = "") -> ApprovalWorkflow:
    from_status = course.status
    to_status = TRANSITIONS[decision]
    course.status = to_status
    if to_status == CourseStatus.APPROVED:
        course.approved_by = actor
        course.approved_at = timezone.now()
    course.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])
    workflow = ApprovalWorkflow.objects.create(
        course=course,
        actor=actor,
        from_status=from_status,
        to_status=to_status,
        decision=decision,
        note=note,
    )
    create_course_version(course, actor, f"Workflow decision: {decision}")
    return workflow
