from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from apps.curriculum.models import CourseStatus, Semester
from apps.curriculum.selectors import course_with_document_parts
from apps.publishing.models import CurriculumTemplate, PublishedCurriculum


def official_course_context(course) -> dict:
    outcomes = [{"id": outcome.code, "description": outcome.description} for outcome in course.outcomes.all()]
    modules = []
    for module in course.modules.all():
        topics = list(module.topics.all())
        units = [
            {
                "number": index + 1,
                "topic": f"{topic.title}: {topic.description}" if topic.description else topic.title,
                "ref": "",
            }
            for index, topic in enumerate(topics)
        ] or [{"number": module.number, "topic": module.content, "ref": ""}]
        modules.append({"number": module.number, "units": units, "hours": module.contact_hours})

    theory_ise1 = min(course.internal_marks, 20)
    theory_ise2 = max(min(course.internal_marks - theory_ise1, 20), 0)
    theory_mse = 0
    theory_ese = course.external_marks
    assessment_items = "".join(
        f"<li><strong>{item.component} ({item.marks} marks):</strong> {item.description}</li>"
        for item in course.assessments.all()
    )

    return {
        "code": course.code,
        "name": course.title,
        "lecture_hrs": course.lecture_hours,
        "tutorial_hrs": course.tutorial_hours,
        "practical_hrs": course.practical_hours,
        "lecture_credits": course.lecture_hours,
        "tutorial_credits": course.tutorial_hours,
        "practical_credits": course.practical_hours,
        "total_credits": course.credits,
        "exam_theory_ise1": theory_ise1,
        "exam_theory_ise2": theory_ise2,
        "exam_theory_mse": theory_mse,
        "exam_theory_ese": theory_ese,
        "exam_theory_total": theory_ise1 + theory_ise2 + theory_mse + theory_ese,
        "has_lab": course.practical_hours > 0 or course.course_type == "LAB",
        "exam_lab_ise1": 25 if course.practical_hours else 0,
        "exam_lab_ise2": 25 if course.practical_hours else 0,
        "exam_lab_total": 50 if course.practical_hours else 0,
        "prerequisites": course.pre_requisites or "Nil",
        "outcomes": outcomes,
        "modules": modules,
        "total_module_hours": sum(module["hours"] for module in modules),
        "experiments": [
            {"number": item.number, "name": item.title, "co": ""}
            for item in course.experiments.all()
        ],
        "assessment_html_content": f"<ol>{assessment_items}</ol>" if assessment_items else "",
        "recommended_books": [
            f"{book.authors}. {book.title}. {book.publisher}, {book.edition}, {book.year}."
            for book in course.reference_books.all()
        ],
    }


class PdfOverflowError(ValueError):
    pass


def validate_and_render(html_string: str, base_url: str, expected_max_pages: int | None = None) -> bytes:
    from weasyprint import HTML

    document = HTML(string=html_string, base_url=base_url).render()
    if expected_max_pages is not None and len(document.pages) > expected_max_pages:
        raise PdfOverflowError(
            f"Content overflow: rendered document has {len(document.pages)} pages, expected at most {expected_max_pages}."
        )
    return document.write_pdf()


def render_pdf(template_name: str, context: dict, expected_max_pages: int | None = None) -> bytes:
    html = render_to_string(template_name, context)
    return validate_and_render(html, str(context["base_url"]), expected_max_pages=expected_max_pages)


def render_course_preview_pdf(course) -> bytes:
    return render_pdf(
        "course_detail.html",
        {
            "course": official_course_context(course),
            "department": course.semester.department,
            "academic_year": course.semester.academic_year,
            "base_url": ".",
        },
        expected_max_pages=4,
    )


def render_reviewer_readonly_pdf(course) -> bytes:
    return render_pdf(
        "reviewer_readonly.html",
        {
            "course": official_course_context(course),
            "comments": course.review_comments.all(),
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
