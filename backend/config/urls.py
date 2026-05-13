from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.views import MeView, UserViewSet
from apps.curriculum.views import (
    AcademicYearViewSet,
    AssessmentSchemeViewSet,
    CourseOutcomeViewSet,
    CourseViewSet,
    CourseInvitationViewSet,
    DepartmentViewSet,
    ExperimentViewSet,
    ModuleViewSet,
    ReferenceBookViewSet,
    SemesterViewSet,
    TopicViewSet,
)
from apps.notifications.views import NotificationViewSet
from apps.publishing.views import CurriculumTemplateViewSet, PublishedCurriculumViewSet
from apps.workflow.views import ApprovalWorkflowViewSet, ReviewerCommentViewSet

router = DefaultRouter()
router.register("users", UserViewSet)
router.register("departments", DepartmentViewSet)
router.register("academic-years", AcademicYearViewSet)
router.register("semesters", SemesterViewSet)
router.register("courses", CourseViewSet)
router.register("course-invitations", CourseInvitationViewSet)
router.register("course-outcomes", CourseOutcomeViewSet)
router.register("modules", ModuleViewSet)
router.register("topics", TopicViewSet)
router.register("experiments", ExperimentViewSet)
router.register("assessment-schemes", AssessmentSchemeViewSet)
router.register("reference-books", ReferenceBookViewSet)
router.register("reviewer-comments", ReviewerCommentViewSet)
router.register("approval-workflows", ApprovalWorkflowViewSet)
router.register("notifications", NotificationViewSet, basename="notification")
router.register("curriculum-templates", CurriculumTemplateViewSet)
router.register("published-curricula", PublishedCurriculumViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
