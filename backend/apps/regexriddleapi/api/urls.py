from django.urls import include, path

from .health import HealthCheckView

urlpatterns = [
    path("health", HealthCheckView.as_view(), name="health-check"),
    path("", include("apps.regexriddleapi.modules.auth.urls")),
    path("", include("apps.regexriddleapi.modules.challenges.urls")),
    path("", include("apps.regexriddleapi.modules.users.urls")),
]
