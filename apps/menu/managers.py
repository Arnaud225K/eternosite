
from mptt.managers import TreeManager
from django.conf import settings 
from django.db.models import Count, Q, Prefetch


VALID_TYPE_MENU_IDS = getattr(settings, 'VALID_TYPE_MENU_IDS', [6, 7, 8])


class MenuCatalogManager(TreeManager):
    """
    Manager personnalisé pour le modèle MenuCatalog.
    """
    def get_root_categories_with_children(self):
        """
        Récupère les catégories racines et précharge TRÈS efficacement
        les 6 premiers enfants directs pour chaque catégorie.
        """
        from .models import MenuCatalog 

        return self.get_queryset().filter(
            level=1, 
            is_hidden=False,
            type_menu_id__in=VALID_TYPE_MENU_IDS
        ).prefetch_related(
            Prefetch(
                'children',
                queryset=MenuCatalog.objects.filter(is_hidden=False).order_by('order_number', 'pk')[:6],
                to_attr='prefetched_children'
            )
        ).order_by('order_number', 'pk')