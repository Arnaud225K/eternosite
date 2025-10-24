from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import StaticText

STATIC_TEXT_CACHE_VERSION_KEY = 'static_text_cache_version'


@receiver([post_save, post_delete], sender=StaticText)
def invalidate_static_text_cache(sender, instance, **kwargs):
    """
    Invalide le cache des textes statiques en incrémentant le numéro de version.
    """
    try:
        new_version = cache.incr(STATIC_TEXT_CACHE_VERSION_KEY)
        print(f"CACHE INVALIDATED: Static text cache version incremented to {new_version}.")
    except ValueError:
        cache.set(STATIC_TEXT_CACHE_VERSION_KEY, 2)
        print(f"CACHE INVALIDATED: Static text cache version initialized to 2.")