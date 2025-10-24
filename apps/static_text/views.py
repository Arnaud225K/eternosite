from django.shortcuts import render

from django.template import Context, Template

from eternoprom.views import global_views
from .models import StaticText
from apps.filial.models import Filial
import logging
from django.core.cache import cache
import hashlib
from .utils import StaticTextLoader


logger = logging.getLogger(__name__)


STATIC_TEXT_CACHE_VERSION_KEY = 'static_text_cache_version'



def get_static_text(slug, request):
    """
    Fonction utilitaire centrale pour récupérer un bloc de texte statique.
    
    Cette fonction est le "cerveau". Elle gère la logique de fallback par filiale
    et le caching. Elle peut être appelée depuis n'importe
    quelle vue ou autre partie du code Python.

    Args:
        slug (str): Le slug du bloc de texte à récupérer.
        request: L'objet request de Django.

    Returns:
        str: Le contenu HTML du texte, ou une chaîne vide si rien n'est trouvé.
    """
    if not slug or not request:
        return ""

    current_filial = getattr(request, 'filial', None)
    filial_id = current_filial.id if current_filial else 'global'
    
        
    version = cache.get(STATIC_TEXT_CACHE_VERSION_KEY, 1)
    
    # On construit une chaîne de base unique
    raw_key = f"static_text.{slug}.filial_{filial_id}"
    
    hashed_key = hashlib.md5(f"{raw_key}:v{version}".encode('utf-8')).hexdigest()
    
    cache_key = f"static_text:{hashed_key}"
        
    
    cached_text = cache.get(cache_key)
    if cached_text is not None:
        logger.debug(f"Cache HIT for static text '{slug}' in filial '{filial_id}'.")
        return cached_text

    logger.debug(f"Cache MISS for static text '{slug}' in filial '{filial_id}'. Querying DB.")
    
    text_to_display = ""
    
    if current_filial:
        static_text_obj = StaticText.objects.filter(slug=slug, filial=current_filial).first()
        if static_text_obj:
            text_to_display = static_text_obj.text or ""

    if not text_to_display:
        static_text_obj = StaticText.objects.filter(slug=slug, filial__isnull=True).first()
        if static_text_obj:
            text_to_display = static_text_obj.text or ""

    cache.set(cache_key, text_to_display, 3600)
    return text_to_display




def static_text(request):
    """
    Fournit un chargeur "paresseux" de textes statiques au contexte.
    """
    return {'static_texts': StaticTextLoader(request)}

