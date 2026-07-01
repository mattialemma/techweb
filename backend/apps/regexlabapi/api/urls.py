from django.urls import include, path

from .health import HealthCheckView

urlpatterns = [
    path("health", HealthCheckView.as_view(), name="health-check"),
    path("", include("apps.regexlabapi.modules.auth.urls")),
    path("", include("apps.regexlabapi.modules.challenges.urls")),
    path("", include("apps.regexlabapi.modules.users.urls")),
]
