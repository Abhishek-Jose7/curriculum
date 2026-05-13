from io import BytesIO

from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from apps.curriculum.models import CourseStatus, Semester
from apps.curriculum.selectors import course_with_document_parts
from apps.publishing.models import CurriculumTemplate, PublishedCurriculum


def render_pdf(template_name: str, context: dict) -> bytes:
    from weasyprint import HTML

    html = render_to_string(template_name, context)
    return HTML(string=html, base_url=str(context["base_url"])).write_pdf()


def render_course_preview_pdf(course) -> bytes:
    return render_pdf(
        "pdf/course_detail.html",
        {
            "course": course,
            "department": course.semester.department,
            "academic_year": course.semester.academic_year,
            "base_url": ".",
        },
    )


def assemble_curriculum_pdf(department, academic_year, template: CurriculumTemplate, user, version_label: str) -> PublishedCurriculum:
    semesters = (
        Semester.objects.filter(department=department, academic_year=academic_year)
        .prefetch_related("courses")
        .order_by("number")
    )
    courses = course_with_document_parts().filter(
        semester__department=department,
        semester__academic_year=academic_year,
        status__in=[CourseStatus.APPROVED, CourseStatus.PUBLISHED],
    )
    pdf = render_pdf(
        "pdf/curriculum_book.html",
        {
            "department": department,
            "academic_year": academic_year,
            "semesters": semesters,
            "courses": courses,
            "template": template,
            "base_url": ".",
        },
    )
    published = PublishedCurriculum.objects.create(
        department=department,
        academic_year=academic_year,
        template=template,
        published_by=user,
        version_label=version_label,
    )
    published.pdf.save(f"{department.code}-{academic_year.name}-{version_label}.pdf", ContentFile(pdf), save=True)
    courses.update(status=CourseStatus.PUBLISHED)
    return published
