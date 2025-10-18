from django.apps import AppConfig


class ProjetSettingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.project_settings'
    verbose_name = 'Настройки проекта'

    def ready(self):
        import apps.project_settings.signals