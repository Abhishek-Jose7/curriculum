from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
import time
from apps.curriculum.models import Department, AcademicYear, Semester, Course, CourseOutcome, Module, Topic, Experiment, AssessmentScheme, ReferenceBook
from apps.publishing.models import CurriculumTemplate
from apps.publishing.services import render_course_preview_pdf, PdfOverflowError

class Command(BaseCommand):
    help = 'Stress test the WeasyPrint rendering pipeline with synthetic worst-case data'

    def handle(self, *args, **options):
        self.stdout.write("Starting rendering stress test...")
        
        with transaction.atomic():
            # Create synthetic data
            dept, _ = Department.objects.get_or_create(code="STRESS", name="Department of Stress Testing")
            year, _ = AcademicYear.objects.get_or_create(name="2099-2100", start_date="2099-06-01", end_date="2100-05-31")
            sem, _ = Semester.objects.get_or_create(department=dept, academic_year=year, number=1, title="Stress Sem")
            
            # Read real template
            import os
            from django.conf import settings
            template_path = os.path.join(settings.BASE_DIR, "templates", "course_detail.html")
            with open(template_path, "r") as f:
                real_html = f.read()

            base_path = os.path.join(settings.BASE_DIR, "templates", "base.html")
            with open(base_path, "r") as f:
                base_html = f.read()
                
            # Quick inline template hack since course_detail extends base.html
            merged_html = base_html.replace("{% block content %}{% endblock %}", real_html.replace('{% extends "base.html" %}', '').replace('{% block content %}', '').replace('{% endblock %}', ''))

            # Ensure template exists
            template, _ = CurriculumTemplate.objects.get_or_create(
                department=dept,
                name="Stress Template",
                defaults={
                    "html_template": merged_html,
                    "css": "body { font-family: 'Times New Roman', serif; } table { table-layout: fixed; width: 100%; }"
                }
            )
            template.is_active = True
            template.save()

            # Worst-case dataset
            course = Course.objects.create(
                semester=sem,
                code="STR101",
                title="Super Long Course Title That Might Wrap Over Multiple Lines In A Table Header Cell Causing Rowspan Misalignments",
                course_type="THEORY",
                lecture_hours=3,
                tutorial_hours=0,
                practical_hours=4,
                credits=5,
                internal_marks=40,
                external_marks=60,
                faculty_name="Dr. Stress Tester",
                pre_requisites="Super long prerequisite string: " + "A, B, C, " * 50
            )

            # Giant COs
            for i in range(1, 15):
                CourseOutcome.objects.create(
                    course=course,
                    code=f"CO{i}",
                    description=f"Extremely verbose description of outcome {i} which entails understanding complex phenomena and applying rigorous mathematical models to synthesize highly scalable and resilient architectures. " * 3,
                    bloom_level="Create",
                    order=i
                )

            # Long module names & oversized tables
            for i in range(1, 7):
                mod = Module.objects.create(
                    course=course,
                    number=i,
                    title=f"Module {i} with a very very long name that just keeps going and going to test table wrapping and orphan headings",
                    content="Content block. " * 20,
                    contact_hours=10
                )
                for j in range(1, 10):
                    Topic.objects.create(
                        module=mod,
                        title=f"Topic {i}.{j} Long Title",
                        description="Topic description that is also extremely long to cause horizontal and vertical overflow and force break-inside avoid rules to trigger. " * 2,
                        order=j
                    )

            # Many experiments
            for i in range(1, 25):
                Experiment.objects.create(
                    course=course,
                    number=i,
                    title=f"Experiment {i}",
                    description="Detailed experimental procedure. " * 5,
                    hours=2
                )

            self.stdout.write("Synthetic data generated. Running render tests...")
            
            # Test Render Iterations
            iterations = 5
            total_time = 0
            for i in range(iterations):
                start = time.time()
                try:
                    pdf_bytes = render_course_preview_pdf(course)
                    duration = time.time() - start
                    total_time += duration
                    self.stdout.write(self.style.SUCCESS(f"Render {i+1} success: {len(pdf_bytes)} bytes in {duration:.2f}s"))
                except PdfOverflowError as e:
                    duration = time.time() - start
                    total_time += duration
                    self.stdout.write(self.style.WARNING(f"Render {i+1} OVERFLOW: {e} in {duration:.2f}s"))
                    self.stdout.write(f"Metrics: {e.metrics}")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Render {i+1} FAILED: {e}"))

            self.stdout.write(f"Average render time: {total_time/iterations:.2f}s")
            
            # Cleanup
            course.delete()
            template.delete()
            sem.delete()
            year.delete()
            dept.delete()
            
        self.stdout.write("Stress test completed.")
