from rest_framework import serializers

from apps.curriculum.models import (
    AcademicYear,
    AssessmentScheme,
    Course,
    CourseInvitation,
    CourseOutcome,
    CourseVersion,
    Department,
    Experiment,
    Module,
    ReferenceBook,
    Semester,
    Topic,
)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = "__all__"


class SemesterSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    academic_year_name = serializers.CharField(source="academic_year.name", read_only=True)

    class Meta:
        model = Semester
        fields = "__all__"


class CourseOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseOutcome
        fields = "__all__"


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = "__all__"


class ModuleSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = "__all__"


class ExperimentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experiment
        fields = "__all__"


class AssessmentSchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentScheme
        fields = "__all__"


class ReferenceBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferenceBook
        fields = "__all__"


class CourseVersionSerializer(serializers.ModelSerializer):
    edited_by_name = serializers.CharField(source="edited_by.get_full_name", read_only=True)

    class Meta:
        model = CourseVersion
        fields = "__all__"
        read_only_fields = ["version_number", "snapshot", "previous_version", "edited_by"]


class CourseInvitationSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source="course.code", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    invitation_url = serializers.SerializerMethodField()

    class Meta:
        model = CourseInvitation
        fields = [
            "id",
            "course",
            "course_code",
            "course_title",
            "email",
            "token",
            "invited_by",
            "accepted_by",
            "expires_at",
            "accepted_at",
            "is_expired",
            "is_accepted",
            "invitation_url",
            "created_at",
        ]
        read_only_fields = ["token", "invited_by", "accepted_by", "accepted_at", "created_at"]

    def get_invitation_url(self, obj):
        request = self.context.get("request")
        frontend_url = getattr(request, "frontend_url", None)
        if not frontend_url:
            from django.conf import settings

            frontend_url = settings.FRONTEND_URL
        return f"{frontend_url}/invite/{obj.token}"


class CourseSerializer(serializers.ModelSerializer):
    semester_label = serializers.SerializerMethodField()
    faculty_name = serializers.CharField(source="faculty.get_full_name", read_only=True)
    outcomes = CourseOutcomeSerializer(many=True, read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    experiments = ExperimentSerializer(many=True, read_only=True)
    assessments = AssessmentSchemeSerializer(many=True, read_only=True)
    reference_books = ReferenceBookSerializer(many=True, read_only=True)
    total_marks = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = "__all__"
        read_only_fields = ["approved_by", "approved_at"]

    def get_semester_label(self, obj):
        return str(obj.semester)

class CourseListSerializer(serializers.ModelSerializer):
    semester_label = serializers.SerializerMethodField()
    faculty_name = serializers.CharField(source="faculty.get_full_name", read_only=True)

    class Meta:
        model = Course
        fields = [
            "id", "code", "title", "course_type", "credits", "status", 
            "semester", "semester_label", "faculty", "faculty_name", 
            "created_at", "updated_at", "approved_at", "approved_by"
        ]
        read_only_fields = ["approved_by", "approved_at"]

    def get_semester_label(self, obj):
        return str(obj.semester)
