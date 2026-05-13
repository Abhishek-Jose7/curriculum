from django.contrib import admin

from apps.curriculum.models import (
    AcademicYear,
    AssessmentScheme,
    Course,
    CourseOutcome,
    CourseVersion,
    Department,
    Experiment,
    Module,
    ReferenceBook,
    Semester,
    Topic,
)

admin.site.register(Department)
admin.site.register(AcademicYear)
admin.site.register(Semester)
admin.site.register(Course)
admin.site.register(CourseOutcome)
admin.site.register(Module)
admin.site.register(Topic)
admin.site.register(Experiment)
admin.site.register(AssessmentScheme)
admin.site.register(ReferenceBook)
admin.site.register(CourseVersion)
