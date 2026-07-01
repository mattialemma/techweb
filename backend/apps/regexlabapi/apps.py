from django.apps import AppConfig


class RegexlabapiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.regexlabapi"
    verbose_name = "REGEXLAB API"

    def ready(self):
        from .modules.users import signals  # noqa: F401
