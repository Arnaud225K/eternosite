from django.apps import AppConfig


class FilialConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.filial'
    verbose_name = 'Филиалы'

    def ready(self):
        import apps.filial.signals