from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Curriculum profile", {"fields": ("role", "department", "designation", "phone")}),)
    list_display = ("username", "email", "role", "department", "is_active", "is_staff")
    list_filter = ("role", "department", "is_active", "is_staff")
