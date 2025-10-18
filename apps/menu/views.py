from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic.base import TemplateView, View
from django.views.generic import DetailView, ListView
from .models import MenuCatalog, TypeMenu, MenuCatalogFilialVisibility
from apps.products.models import Product, FilterCategory, FilterValue
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.http import HttpResponseNotFound, HttpResponse
from django.template.loader import render_to_string
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger, Page
from django.http import HttpResponse, JsonResponse, Http404
from django.urls import reverse
import logging
from django.utils.text import slugify
from django.db.models.functions import Concat
from django.db.models import Q, Case, When, IntegerField, Value, Count, Prefetch
import random
from django.conf import settings
from collections import defaultdict
import urllib.parse
from django.template.loader import render_to_string
from unidecode import unidecode 
# from apps.static_text.views import get_static_text
# from apps.checkout.cart import CartManager
from django.middleware.csrf import get_token
from apps.utils.utils import (
    parse_filters_from_segment, 
    apply_filters_to_queryset, 
    get_available_filters,
    get_active_filters_data,
    build_filter_url_segment,
    get_active_filters_display_string,
    minfirst,
)
# from apps.products.views import RecentlyViewed
# from apps.offers.models import OfferCollection
# from apps.reviews.models import Review
# from apps.articles.models import Articles
from apps.project_settings.models import ProjectSettings


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)



INDEX_TITLE_PAGE = 'index_title_page'
INDEX_META_DESCRIPTION = 'index_meta_description'
INDEX_META_KEYWORDS = 'index_meta_keywords'

INDEX_ABOUT_US_TEXT = 'index_about_us_text'

CATEGORY_META_TITLE_PAGE = 'category_meta_title_page'
CATEGORY_META_DESCRIPTION = 'category_meta_description'
CATEGORY_META_KEYWORDS = 'category_meta_keywords'
CATEGORY_AUTOTEXT = 'category_autotext'

PRODUCT_META_TITLE_PAGE = 'product_meta_title_page'
PRODUCT_META_DESCRIPTION = 'product_meta_description'
PRODUCT_META_KEYWORDS = 'product_meta_keywords'
PRODUCT_AUTOTEXT = 'product_autotext'


SIZE_SALE_INDEX = 20
PRODUCTS_PER_PAGE = 2
SIZE_OFFERS_INDEX = 6
SIZE_SPEC_OFFERS = 10
SIZE_REVIEWS_LIST = 10
SIZE_ARTICLE_LIST = 4
PRODUCT_CATEGORY_TYPE_IDS = [6, 7, 8]
SIZE_POP_CATEG_INDEX = 7










class IndexView(TemplateView):
    template_name = "catalog/index.html"

    def get(self, request):
        
        is_index = True
        current_filial = request.filial
        
        # 1. Popular categories
        popular_categories = MenuCatalog.objects.filter(type_menu_id__in=PRODUCT_CATEGORY_TYPE_IDS, is_hidden=False, is_show_main=True).order_by('order_number')[:SIZE_POP_CATEG_INDEX]


        context = {
            'is_index' : is_index,
            'popular_categories':popular_categories,
        }

        return render(request, self.template_name, context)
    


class MenuView(View):
    """
    Une vue de base qui gère l'affichage des pages de catégories/menus.
    Toute la logique est contenue dans la méthode get().
    """

    template_name = 'catalog/catalog.html'
    
    def get(self, request, hierarchical_slug, filter_segment=None, *args, **kwargs):
        """
        Gère les requêtes GET pour une page de catégorie.
        
        Args:
            request: L'objet de la requête HTTP.
            hierarchical_slug (str): Le chemin hiérarchique capturé depuis l'URL.
        """
        
        # 1. Trouver et Valider la Catégorie Actuelle 
        hierarchy_path = hierarchical_slug
        slugs = hierarchy_path.strip('/').split('/')
        current_slug = slugs[-1]

        target_item = None
        try:
            target_item = MenuCatalog.objects.select_related('parent', 'type_menu').get(slug=current_slug, is_hidden=False)
            ancestors = target_item.get_ancestors(include_self=True)
            candidate_slugs = [slugify(unidecode(a.slug or f"cat-{a.id}")) for a in ancestors]
            if candidate_slugs != slugs:
                logger.warning(f"Path mismatch for slug '{current_slug}'. Expected '{'/'.join(candidate_slugs)}', got '{hierarchy_path}'. Raising 404.")
                raise Http404("Category path mismatch or inactive")
        except MenuCatalog.DoesNotExist:
            raise Http404("Category not found")
        except MenuCatalog.MultipleObjectsReturned:
            # Gérer le cas où le slug final n'est pas unique globalement
            logger.error(f"Multiple categories found with slug '{current_slug}'. This should ideally not happen if slugs are unique per level or globally.")
            raise Http404("Ambiguous category slug")

        current_menu = target_item

        current_filial = request.filial

        root_categories = MenuCatalog.objects.get_root_categories_with_children()

        active_filters = parse_filters_from_segment(filter_segment)

        descendant_categories = current_menu.get_descendants(include_self=True)
        
        subcategories = current_menu.get_children().filter(is_hidden=False)
        

        # 2. GESTION DES PRODUITS ET FILTRES 
        product_categories_qs = MenuCatalog.objects.filter(pk=current_menu.pk)
            
        base_products_queryset = Product.objects.filter(category__in=product_categories_qs, is_hidden=False).select_related('category').prefetch_related('images')


        filtered_products_qs = apply_filters_to_queryset(base_products_queryset, active_filters)


        # --- NOUVEAU BLOC : NETTOYAGE DES FILTRES ACTIFS ---
        # On regarde quels filtres sont réellement présents sur les produits trouvés
        valid_value_slugs = set(FilterValue.objects.filter(
            products__in=filtered_products_qs
        ).values_list('slug', flat=True))
        
        # On reconstruit un dictionnaire de filtres actifs qui ne contient que les options valides
        final_active_filters = {}
        for group_slug, value_slugs in active_filters.items():
            valid_selections = [slug for slug in value_slugs if slug in valid_value_slugs]
            if valid_selections:
                final_active_filters[group_slug] = valid_selections
        # --- FIN DU NOUVEAU BLOC ---


        # 3. PAGINATION DES PRODUITS 
        paginator = Paginator(filtered_products_qs.prefetch_related('images','filial_data__filial', 'filters__category'), PRODUCTS_PER_PAGE)
        page_number = request.GET.get('page')
        products_page_obj = paginator.get_page(page_number)

        # 4. Recalculer la disponibilité des filtres en passant le queryset déjà filtré
        available_filters = get_available_filters(
            category=current_menu, 
            base_queryset=base_products_queryset, 
            active_filters=final_active_filters,
        )

        active_filters_list = get_active_filters_data(final_active_filters)

        for product in products_page_obj.object_list:
            product.display_price = product.get_price_for_filial(current_filial)
        


        display_string = get_active_filters_display_string(final_active_filters)
        
        
        h1_title = current_menu.name
        if display_string:
            h1_title += f", {display_string}"

        current_page_number = products_page_obj.number
        if current_page_number > 1:
            h1_title += f" - страница {current_page_number}"
        
        
        h1_title_lowercase = minfirst(h1_title)

        
        base_api_url = reverse('menu:api_filter_products', kwargs={'hierarchical_slug': hierarchical_slug})


        context = {
            'current_menu': current_menu,
            'current_filial': current_filial,
            'root_categories': root_categories,
            'ancestors': ancestors,
            'subcategories':subcategories,
            'products_list': products_page_obj, 
            'base_api_url': base_api_url,
            'available_filters': available_filters,
            'active_filters': final_active_filters,
            'active_filters_list': active_filters_list,
            'h1_title': h1_title,
            'h1_title_lowercase':h1_title_lowercase,
            'template_vars': {
                'current_filial':current_filial,
                'category_name': h1_title,
                # 'category_name_lowercase': h1_title_lowercase,
                'request': request,
            },
        }

        template_to_render = self.template_name
        if hasattr(current_menu, 'type_menu') and current_menu.type_menu and current_menu.type_menu.template:
            if isinstance(current_menu.type_menu.template, str) and current_menu.type_menu.template.endswith('.html'):
                template_to_render = current_menu.type_menu.template
            else:
                logger.warning(f"Invalid template path for MenuCatalog {current_menu.id} TypeMenu: {current_menu.type_menu.template}. Using default.")
        else:
            logger.debug(f"No specific template for MenuCatalog {current_menu.id}. Using default: {template_to_render}")
        
        return render(request, template_to_render, context)





class FilterProductsAPIView(View):
    def get(self, request, hierarchical_slug, filter_segment=None, *args, **kwargs):
        
        # 1. Obtenir la catégorie et le queryset de base
        try:
            current_slug = hierarchical_slug.strip('/').split('/')[-1]
            current_menu = MenuCatalog.objects.get(slug=current_slug, is_hidden=False)
        except MenuCatalog.DoesNotExist:
            return JsonResponse({'error': 'Category not found'}, status=404)
        
        # On détermine quelles catégories inclure dans la recherche de produits
        product_categories_qs = MenuCatalog.objects.filter(pk=current_menu.pk)

        csrf_token_value = get_token(request)
            
        base_products_queryset = Product.objects.filter(category__in=product_categories_qs, is_hidden=False)
        
        # 2. Parser et appliquer les filtres depuis l'URL
        active_filters = parse_filters_from_segment(filter_segment)
        filtered_products_qs = apply_filters_to_queryset(base_products_queryset, active_filters)


        # --- NOUVEAU BLOC : NETTOYAGE DES FILTRES ACTIFS (identique à MenuView) ---
        valid_value_slugs = set(FilterValue.objects.filter(
            products__in=filtered_products_qs
        ).values_list('slug', flat=True))
        
        final_active_filters = {}
        for group_slug, value_slugs in active_filters.items():
            valid_selections = [slug for slug in value_slugs if slug in valid_value_slugs]
            if valid_selections:
                final_active_filters[group_slug] = valid_selections
        # --- FIN DU NOUVEAU BLOC ---        

        # 3. Compter les produits et paginer
        product_count = filtered_products_qs.count()
        paginator = Paginator(filtered_products_qs.prefetch_related('images', 'filial_data__filial', 'filters__category'), PRODUCTS_PER_PAGE)
        page_number = request.GET.get('page')
        products_page_obj = paginator.get_page(page_number)

        # 4. Recalculer la disponibilité des filtres
        available_filters = get_available_filters(
            category=current_menu, 
            base_queryset=base_products_queryset, 
            active_filters=final_active_filters,
        )

        # 5. Préparer les données pour les partiels
        active_filters_list = get_active_filters_data(final_active_filters)
        
        for product in products_page_obj.object_list:
            product.display_price = product.get_price_for_filial(request.filial)

        # 6. Construire le H1 dynamique
        display_string = get_active_filters_display_string(final_active_filters)
        h1_title = current_menu.name
        if display_string:
            h1_title += f", {display_string}"
        current_page_number = products_page_obj.number
        if current_page_number > 1:
            h1_title += f" - страница {current_page_number}"

        # 7. Rendre les partiels en HTML
        context_products = {
            'products_list': products_page_obj, 
            'request': request,
        }
        html_products = render_to_string('includes/partials/_products_partial.html', context_products, request=request)
        
        context_filters = {
            'available_filters': available_filters, 
            'active_filters': final_active_filters,
            'request': request,
            'csrf_token': csrf_token_value,
        }
        html_filters = render_to_string('includes/partials/_filters_partial.html', context_filters)
        

        context_active_filters = {
            'active_filters_list': active_filters_list
        }
        html_active_filters = render_to_string(
            'includes/partials/_active_filters.html',
            context_active_filters,
            request=request
        )
        
        context_pagination = {
            'products_list': products_page_obj
        }
        html_pagination = render_to_string(
            'includes/partials/_pagination_partial.html',
            context_pagination,
            request=request
        )

        # 8. CONSTRUCTION DE L'URL FINALE ---
        base_url = current_menu.get_absolute_url()
        filter_segment = build_filter_url_segment(final_active_filters)
        
        url_path = base_url
        if filter_segment:
            if not url_path.endswith('/'):
                url_path += '/'
            url_path += filter_segment

        query_params = {}
        # on ajoute le paramètre 'page' SEULEMENT si ce n'est pas la première page.
        if products_page_obj.number > 1:
            query_params['page'] = products_page_obj.number
        
        final_new_url = url_path
        if query_params:
            query_string = urllib.parse.urlencode(query_params)
            final_new_url += '?' + query_string

        # 9. Renvoyer la réponse JSON
        return JsonResponse({
            'html_products': html_products,
            'html_filters': html_filters,
            'html_active_filters': html_active_filters,
            'html_pagination': html_pagination,
            'new_url': final_new_url,
            'product_count': product_count,
            'h1_title': h1_title,
        })


class ProductView(View):
    """
    Gère l'affichage de la page de détail d'un produit.
    """
    template_name = 'catalog/product.html'

    def get(self, request, product_slug):
        
        current_filial = request.filial

        # 1. RÉCUPÉRER LE PRODUIT PRINCIPAL AVEC OPTIMISATIONS
        try:
            product = Product.objects.select_related('category').prefetch_related('images', 'filters__category', 'filial_data__filial').get(slug=product_slug, is_hidden=False)
        except Product.DoesNotExist:
            raise Http404("Product not found")


        # 2. PRÉPARER LES DONNÉES SPÉCIFIQUES À L'AFFICHAGE
        # On calcule le prix du produit principal pour la filiale
        product.display_price = product.get_price_for_filial(current_filial)
        
        # On structure les caractéristiques (filtres) pour un affichage propre
        product_features = {}
        for f in product.filters.all():
            cat_name = f.category.name
            if cat_name not in product_features:
                product_features[cat_name] = []
            product_features[cat_name].append(f.value)

        # 3. PRÉPARER LES DONNÉES DE NAVIGATION (FIL D'ARIANE)
        current_menu = product.category
        ancestors = current_menu.get_ancestors(include_self=True)


        h1_title = product.full_title


        # 4. PRÉPARER LE CONTEXTE FINAL
        context = {
            'product': product,
            'current_filial': current_filial,
            'current_menu': current_menu,
            'ancestors': ancestors,
            'product_features': product_features,
            'h1_title': h1_title,
            'is_page_product': True,
            'template_vars': {
                'current_filial':current_filial,
                'product_name': h1_title,
                'request': request,
            },
        }
        
        return render(request, self.template_name, context)
    

