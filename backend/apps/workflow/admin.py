from django.contrib import admin

from apps.workflow.models import ApprovalWorkflow, ReviewerComment

admin.site.register(ApprovalWorkflow)
admin.site.register(ReviewerComment)
