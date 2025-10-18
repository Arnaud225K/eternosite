from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Filial

@receiver([post_save, post_delete], sender=Filial)
def invalidate_filial_cache(sender, instance, **kwargs):
    """
    Supprime du cache la filiale qui vient d'être modifiée ou supprimée.
    """
    cache_key_subdomain = f"filial_subdomain_{instance.subdomain}"
    cache.delete(cache_key_subdomain)

    if instance.is_default:
        cache_key_default = "filial_default"
        cache.delete(cache_key_default)