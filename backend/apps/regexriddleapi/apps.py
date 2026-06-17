from django.apps import AppConfig


class RegexriddleapiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.regexriddleapi"
    verbose_name = "REGEXRIDDLE API"

    def ready(self):
        from .modules.users import signals  # noqa: F401
