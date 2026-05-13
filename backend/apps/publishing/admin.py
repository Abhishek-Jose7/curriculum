from django.contrib import admin

from apps.publishing.models import CurriculumTemplate, PublishedCurriculum

admin.site.register(CurriculumTemplate)
admin.site.register(PublishedCurriculum)
