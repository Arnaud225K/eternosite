import logging
import hashlib
from django.core.cache import cache
from .models import StaticText

logger = logging.getLogger(__name__)


STATIC_TEXT_CACHE_VERSION_KEY = 'static_text_cache_version'

class StaticTextLoader:
    """
    Une classe "paresseuse" (lazy) et optimisée qui récupère les textes statiques
    à la demande, en utilisant un cache versionné et sécurisé.
    """
    def __init__(self, request):
        self.request = request
        self._local_cache = {}

    def __getitem__(self, slug):
        """
        Permet d'utiliser la syntaxe `static_texts.my_slug` dans les templates.
        """
        if slug in self._local_cache:
            return self._local_cache[slug]

        current_filial = getattr(self.request, 'filial', None)
        filial_id_str = str(current_filial.id) if current_filial else 'global'
        
        version = cache.get(STATIC_TEXT_CACHE_VERSION_KEY, 1)
        
        raw_key = f"static_text.{slug}.filial_{filial_id_str}"
        hashed_key = hashlib.md5(f"{raw_key}:v{version}".encode('utf-8')).hexdigest()
        cache_key = f"stxt:{hashed_key}"

        cached_text = cache.get(cache_key)
        if cached_text is not None:
            self._local_cache[slug] = cached_text
            return cached_text
        
        text_to_display = ""
        
        if current_filial:
            specific_text = StaticText.objects.filter(slug=slug, filial=current_filial).values_list('text', flat=True).first()
            
            if specific_text is not None:
                text_to_display = specific_text

        if text_to_display == "":
            global_text = StaticText.objects.filter(slug=slug, filial__isnull=True).values_list('text', flat=True).first()

            if global_text is not None:
                text_to_display = global_text
            
        cache.set(cache_key, text_to_display, 3600) # Cache 1 hour
        self._local_cache[slug] = text_to_display
        
        return text_to_display