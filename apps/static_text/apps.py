from django.apps import AppConfig


class StaticTextConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.static_text'
    verbose_name = 'Статические тексты'

    def ready(self):
        import apps.static_text.signals