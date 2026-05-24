from rest_framework import serializers

from apps.publishing.models import CurriculumTemplate, PublishedCurriculum


class CurriculumTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurriculumTemplate
        fields = "__all__"
        read_only_fields = ["is_locked", "version"]

    def validate(self, attrs):
        if self.instance and self.instance.is_locked:
            content_fields = {"html_template", "css", "name"}
            changing_content = any(
                field in attrs and getattr(self.instance, field) != attrs[field]
                for field in content_fields
            )
            if changing_content:
                raise serializers.ValidationError(
                    "This template is locked after publish. Create a copy to make changes."
                )
        return attrs


class PublishedCurriculumSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    academic_year_name = serializers.CharField(source="academic_year.name", read_only=True)

    class Meta:
        model = PublishedCurriculum
        fields = "__all__"
        read_only_fields = ["published_by", "pdf", "docx"]
