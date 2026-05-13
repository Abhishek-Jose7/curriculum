from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.accounts.models import Role
from apps.curriculum.models import AcademicYear, AssessmentScheme, Course, CourseOutcome, Department, Module, ReferenceBook, Semester, Topic
from apps.publishing.models import CurriculumTemplate


class Command(BaseCommand):
    help = "Create sample users, department, semester, course content, and template data."

    def handle(self, *args, **options):
        User = get_user_model()
        department, _ = Department.objects.get_or_create(
            code="COMP",
            defaults={
                "name": "Computer Engineering",
                "college_name": "College of Engineering",
                "university_name": "Official University",
            },
        )
        year, _ = AcademicYear.objects.get_or_create(
            name="2026-27",
            defaults={"starts_on": date(2026, 7, 1), "ends_on": date(2027, 6, 30), "is_active": True},
        )
        semester, _ = Semester.objects.get_or_create(department=department, academic_year=year, number=3, defaults={"title": "Semester III"})
        admin, _ = User.objects.get_or_create(username="admin", defaults={"email": "admin@example.edu", "role": Role.ADMIN, "department": department, "is_staff": True, "is_superuser": True})
        faculty, _ = User.objects.get_or_create(username="faculty", defaults={"email": "faculty@example.edu", "role": Role.FACULTY, "department": department})
        reviewer, _ = User.objects.get_or_create(username="reviewer", defaults={"email": "reviewer@example.edu", "role": Role.REVIEWER, "department": department})
        for user in [admin, faculty, reviewer]:
            user.set_password("ChangeMe123!")
            user.save()
        course, _ = Course.objects.get_or_create(
            semester=semester,
            code="CS301",
            defaults={
                "title": "Data Structures and Algorithms",
                "faculty": faculty,
                "lecture_hours": 3,
                "tutorial_hours": 1,
                "credits": 4,
                "internal_marks": 40,
                "external_marks": 60,
                "objectives": "Introduce abstract data types, algorithm design, and complexity analysis.",
            },
        )
        CourseOutcome.objects.get_or_create(course=course, code="CO1", defaults={"description": "Apply linear and non-linear data structures.", "bloom_level": "Apply", "order": 1})
        CourseOutcome.objects.get_or_create(course=course, code="CO2", defaults={"description": "Analyze algorithmic complexity for common operations.", "bloom_level": "Analyze", "order": 2})
        module, _ = Module.objects.get_or_create(course=course, number=1, defaults={"title": "Linear Data Structures", "contact_hours": 10, "content": "Arrays, linked lists, stacks, queues, and applications."})
        Topic.objects.get_or_create(module=module, order=1, defaults={"title": "Stacks and Queues", "description": "ADT operations and applications."})
        AssessmentScheme.objects.get_or_create(course=course, component="Continuous Assessment", defaults={"marks": 40, "description": "Assignments, quizzes, and internal tests.", "order": 1})
        AssessmentScheme.objects.get_or_create(course=course, component="End Semester Examination", defaults={"marks": 60, "description": "University theory examination.", "order": 2})
        ReferenceBook.objects.get_or_create(course=course, title="Data Structures and Algorithm Analysis", defaults={"authors": "Mark Allen Weiss", "publisher": "Pearson", "edition": "3rd", "year": "2012", "is_textbook": True})
        CurriculumTemplate.objects.get_or_create(
            department=department,
            name="Official University Template",
            defaults={"html_template": "templates/pdf/curriculum_book.html", "css": "See backend/templates/pdf/base.html", "is_active": True},
        )
        self.stdout.write(self.style.SUCCESS("Seed data created. Users: admin/faculty/reviewer, password: ChangeMe123!"))
