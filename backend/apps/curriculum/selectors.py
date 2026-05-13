from apps.curriculum.models import Course


def course_with_document_parts():
    return (
        Course.objects.select_related("semester", "semester__department", "semester__academic_year", "faculty", "approved_by")
        .prefetch_related("outcomes", "modules__topics", "experiments", "assessments", "reference_books")
    )
