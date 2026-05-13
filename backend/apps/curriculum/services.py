from django.forms.models import model_to_dict

from apps.curriculum.models import Course, CourseVersion


def serialize_course_snapshot(course: Course) -> dict:
    course = (
        Course.objects.select_related("semester", "faculty", "approved_by")
        .prefetch_related("outcomes", "modules__topics", "experiments", "assessments", "reference_books")
        .get(pk=course.pk)
    )
    return {
        "course": model_to_dict(course, exclude=["faculty", "approved_by"]),
        "faculty_id": course.faculty_id,
        "approved_by_id": course.approved_by_id,
        "outcomes": [model_to_dict(item, exclude=["course"]) for item in course.outcomes.all()],
        "modules": [
            {
                **model_to_dict(module, exclude=["course"]),
                "topics": [model_to_dict(topic, exclude=["module"]) for topic in module.topics.all()],
            }
            for module in course.modules.all()
        ],
        "experiments": [model_to_dict(item, exclude=["course"]) for item in course.experiments.all()],
        "assessments": [model_to_dict(item, exclude=["course"]) for item in course.assessments.all()],
        "reference_books": [model_to_dict(item, exclude=["course"]) for item in course.reference_books.all()],
    }


def create_course_version(course: Course, user, change_summary: str = "") -> CourseVersion:
    latest = course.versions.order_by("-version_number").first()
    return CourseVersion.objects.create(
        course=course,
        version_number=(latest.version_number + 1 if latest else 1),
        edited_by=user if getattr(user, "is_authenticated", False) else None,
        previous_version=latest,
        snapshot=serialize_course_snapshot(course),
        change_summary=change_summary,
    )
