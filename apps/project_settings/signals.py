from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Advantage, ProjectSettings

@receiver([post_save, post_delete], sender=Advantage)
def invalidate_advantages_cache(sender, instance, **kwargs):
    """ Supprime le cache des avantages de la page d'accueil. """
    cache.delete('homepage_advantages')


@receiver([post_save, post_delete], sender=ProjectSettings)
def invalidate_project_settings_cache(sender, instance, **kwargs):
    """
    Supprime le cache de l'objet ProjectSettings à chaque modification ou suppression.
    """
    cache_key = 'project_settings_singleton'
    cache.delete(cache_key)
    print(f"CACHE INVALIDATED: Key '{cache_key}' deleted.")