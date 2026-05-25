import os

from django.conf import settings
from django.core.files.base import ContentFile
from django.template.loader import render_to_string

from apps.curriculum.models import CourseStatus, Semester
from apps.publishing.models import CurriculumTemplate, PublishedCurriculum


def official_course_context(course) -> dict:
    """Build the template context dict for a single course.
    
    This is the CANONICAL data transform — used by preview AND publish.
    """
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
        "course_type": course.course_type,
        "lecture_hrs": course.lecture_hours,
        "tutorial_hrs": course.tutorial_hours,
        "practical_hrs": course.practical_hours,
        "lecture_credits": course.lecture_credits,
        "tutorial_credits": course.tutorial_credits,
        "practical_credits": course.practical_credits,
        "total_credits": course.credits,
        "exam_theory_ise1": theory_ise1,
        "exam_theory_ise2": theory_ise2,
        "exam_theory_mse": theory_mse,
        "exam_theory_ese": theory_ese,
        "exam_theory_total": theory_ise1 + theory_ise2 + theory_mse + theory_ese,
        "has_lab": course.practical_hours > 0 or course.practical_credits > 0 or course.course_type in ["LAB", "THEORY_LAB"],
        "exam_lab_ise1": 25 if (course.practical_hours or course.course_type in ["LAB", "THEORY_LAB"]) else 0,
        "exam_lab_ise2": 25 if (course.practical_hours or course.course_type in ["LAB", "THEORY_LAB"]) else 0,
        "exam_lab_total": 50 if (course.practical_hours or course.course_type in ["LAB", "THEORY_LAB"]) else 0,
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
    def __init__(self, message, metrics=None):
        super().__init__(message)
        self.metrics = metrics or {}


def _estimate_section_heights(course_ctx: dict) -> dict:
    """Pre-render heuristic to estimate section heights and predict pagination.
    
    Returns a dict of section keys → estimated mm heights.
    """
    BASE_TABLE_HEADER_MM = 12
    ROW_HEIGHT_MM = 6
    HEADING_HEIGHT_MM = 8
    A4_CONTENT_HEIGHT_MM = 297 - 28 - 18  # = 251mm usable

    sections = {}
    
    # Teaching + Exam scheme tables
    sections["teaching_exam"] = BASE_TABLE_HEADER_MM * 2 + ROW_HEIGHT_MM * 4
    
    # Outcomes table
    num_outcomes = len(course_ctx.get("outcomes", []))
    sections["outcomes"] = BASE_TABLE_HEADER_MM + ROW_HEIGHT_MM * (num_outcomes + 2)
    
    # Modules table
    total_rows = sum(len(m.get("units", [])) for m in course_ctx.get("modules", []))
    sections["modules"] = BASE_TABLE_HEADER_MM + ROW_HEIGHT_MM * max(total_rows, 1) + HEADING_HEIGHT_MM
    
    # Experiments table
    num_experiments = len(course_ctx.get("experiments", []))
    if num_experiments:
        sections["experiments"] = BASE_TABLE_HEADER_MM + ROW_HEIGHT_MM * num_experiments
    
    # Assessment + References
    sections["assessments"] = HEADING_HEIGHT_MM + ROW_HEIGHT_MM * 4
    sections["references"] = HEADING_HEIGHT_MM + ROW_HEIGHT_MM * len(course_ctx.get("recommended_books", []))

    total_mm = sum(sections.values())
    estimated_pages = max(1, -(-total_mm // A4_CONTENT_HEIGHT_MM))  # ceil division
    
    return {
        "section_heights_mm": sections,
        "total_estimated_mm": total_mm,
        "estimated_pages": estimated_pages,
        "usable_height_mm": A4_CONTENT_HEIGHT_MM,
    }


def _detect_overflow_sections(course_ctx: dict) -> list[str]:
    """Return a list of warning strings for sections that may overflow."""
    warnings = []
    estimation = _estimate_section_heights(course_ctx)
    
    for section_key, height_mm in estimation["section_heights_mm"].items():
        if height_mm > estimation["usable_height_mm"]:
            warnings.append(
                f"{section_key} estimated at {height_mm:.0f}mm — exceeds single-page printable region ({estimation['usable_height_mm']:.0f}mm)"
            )
    
    # Module-level overflow detection
    ROW_HEIGHT_MM = 6
    BASE_TABLE_HEADER_MM = 12
    for module in course_ctx.get("modules", []):
        module_rows = len(module.get("units", []))
        module_height = BASE_TABLE_HEADER_MM + ROW_HEIGHT_MM * module_rows
        if module_height > estimation["usable_height_mm"] * 0.8:  # 80% of page is a warning
            warnings.append(
                f"Module {module.get('number', '?')} has {module_rows} unit rows — may exceed printable region"
            )
    
    return warnings


def validate_and_render(html_string: str, base_url: str, expected_max_pages: int | None = None) -> tuple[bytes, dict]:
    """Render HTML to PDF via WeasyPrint and return (pdf_bytes, metrics).
    
    Raises PdfOverflowError if page count exceeds expected_max_pages.
    """
    from weasyprint import HTML

    document = HTML(string=html_string, base_url=base_url).render()
    
    page_count = len(document.pages)
    metrics = {
        "page_count": page_count,
        "is_overflow": expected_max_pages is not None and page_count > expected_max_pages,
        "expected_max": expected_max_pages,
    }
    
    if metrics["is_overflow"]:
        raise PdfOverflowError(
            f"Content overflow: rendered document has {page_count} pages, expected at most {expected_max_pages}.",
            metrics=metrics,
        )
    return document.write_pdf(), metrics


def _get_static_base_url() -> str:
    """Return the base URL for static file resolution during WeasyPrint rendering."""
    static_root = getattr(settings, "STATIC_ROOT", None)
    if static_root and os.path.isdir(static_root):
        return f"file://{os.path.abspath(static_root)}/"
    return f"file://{os.path.abspath(os.path.join(settings.BASE_DIR, 'static'))}/"


def render_course_preview_pdf(course) -> bytes:
    """Render a single-course preview PDF using the CANONICAL file-based templates.
    
    Uses templates/course_detail.html → templates/pdf/base.html → templates/pdf/partials/course_body.html.
    This is the SAME rendering path as publish, ensuring preview == publish.
    """
    course_ctx = official_course_context(course)
    
    # Pre-render validation
    overflow_warnings = _detect_overflow_sections(course_ctx)
    estimation = _estimate_section_heights(course_ctx)
    
    # Load optional DB template CSS override (but NOT the HTML — we always use file-based templates)
    template = CurriculumTemplate.objects.filter(department=course.semester.department, is_active=True).first()
    template_css = template.css if template else ""
    
    html = render_to_string("course_detail.html", {
        "course": course_ctx,
        "department": course.semester.department,
        "academic_year": course.semester.academic_year,
        "template_css": template_css,
        "is_preview": True,
        "overflow_warnings": overflow_warnings,
        "render_estimation": estimation,
    })
    
    pdf_bytes, metrics = validate_and_render(
        html,
        _get_static_base_url(),
        expected_max_pages=4,
    )
    
    metrics["overflow_warnings"] = overflow_warnings
    metrics["estimation"] = estimation
    return pdf_bytes


def render_reviewer_readonly_pdf(course) -> bytes:
    """Render a reviewer-facing read-only PDF with comment table appended.
    
    Uses the SAME canonical templates + print.css as preview/publish.
    """
    course_ctx = official_course_context(course)
    
    template = CurriculumTemplate.objects.filter(department=course.semester.department, is_active=True).first()
    template_css = template.css if template else ""
    
    html = render_to_string("reviewer_readonly.html", {
        "course": course_ctx,
        "comments": course.review_comments.all(),
        "department": course.semester.department,
        "academic_year": course.semester.academic_year,
        "template_css": template_css,
        "is_review": True,
    })
    
    pdf_bytes, metrics = validate_and_render(html, _get_static_base_url())
    return pdf_bytes


def assemble_curriculum_pdf(department, academic_year, template: CurriculumTemplate, user, version_label: str) -> PublishedCurriculum:
    """Assemble a full multi-course curriculum book PDF.
    
    Uses the SAME canonical base template, CSS, and course body partial as preview.
    The only difference is the outer wrapper (curriculum_book.html loops over courses).
    """
    from apps.curriculum.selectors import course_with_document_parts
    
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
    
    course_contexts = [official_course_context(c) for c in courses]
    
    # Pre-render validation for all courses
    all_warnings = []
    for ctx in course_contexts:
        warnings = _detect_overflow_sections(ctx)
        if warnings:
            all_warnings.extend([f"[{ctx['code']}] {w}" for w in warnings])
    
    html = render_to_string("pdf/curriculum_book.html", {
        "department": department,
        "academic_year": academic_year,
        "semesters": semesters,
        "courses": course_contexts,
        "template_css": template.css,
        "is_full_book": True,
    })
    
    pdf_bytes, metrics = validate_and_render(html, _get_static_base_url())
    
    # Freeze the template snapshot
    published = PublishedCurriculum.objects.create(
        department=department,
        academic_year=academic_year,
        template=template,
        published_by=user,
        version_label=version_label,
        template_snapshot={
            "css": template.css,
            "html_template": template.html_template,
            "name": template.name,
            "frozen_at": str(academic_year),
        },
        render_metrics={
            "page_count": metrics["page_count"],
            "course_count": len(course_contexts),
            "overflow_warnings": all_warnings,
        },
    )
    published.pdf.save(
        f"{department.code}-{academic_year.name}-{version_label}.pdf",
        ContentFile(pdf_bytes),
        save=True,
    )
    courses.update(status=CourseStatus.PUBLISHED)
    
    # Lock the template after publish
    template.is_locked = True
    template.save(update_fields=["is_locked", "updated_at"])
    
    return published


def get_render_estimation(course) -> dict:
    """Public API: get pre-render estimation metrics without generating PDF."""
    course_ctx = official_course_context(course)
    estimation = _estimate_section_heights(course_ctx)
    warnings = _detect_overflow_sections(course_ctx)
    return {
        "estimation": estimation,
        "overflow_warnings": warnings,
    }
