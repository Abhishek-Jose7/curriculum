from rest_framework import serializers

from apps.accounts.models import User


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "department",
            "department_name",
            "designation",
            "phone",
            "is_active",
        ]
        read_only_fields = ["id"]


class MeSerializer(UserSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["permissions"]

    def get_permissions(self, obj):
        return {
            "can_manage_workflows": obj.is_academic_admin,
            "can_review": obj.role in {"REVIEWER", "ADMIN", "HOD"} or obj.is_superuser,
            "can_publish": obj.role in {"ADMIN", "HOD"} or obj.is_superuser,
        }
