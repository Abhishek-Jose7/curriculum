from rest_framework import serializers

from apps.publishing.models import CurriculumTemplate, PublishedCurriculum


class CurriculumTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurriculumTemplate
        fields = "__all__"


class PublishedCurriculumSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    academic_year_name = serializers.CharField(source="academic_year.name", read_only=True)

    class Meta:
        model = PublishedCurriculum
        fields = "__all__"
        read_only_fields = ["published_by", "pdf", "docx"]
