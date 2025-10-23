import datetime
import json
import os
from . import settings
from django.db.models import Q
from django.http import HttpResponseRedirect, HttpResponse, Http404, JsonResponse
from django.shortcuts import render

from django.core.cache import cache

from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from apps.project_settings.models import ProjectSettings, SocialLink

from apps.filial.models import Filial
# from apps.offers.models import OfferCollection
# from filials.views import get_current_filial

from apps.menu.models import MenuCatalog
# from robots.models import RobotsTxt
from apps.checkout.cart import CartManager
from django.utils import timezone 

MAX_ITEM_IN_FILE = 20000

MAX_HEADER_MENU_ITEMS = 6

PRODUCT_CATEGORY_TYPE_IDS = [6, 7, 8]






def global_views(request):
    """
    Context processor unique et optimisé pour les données globales.
    """
    
    cache_key_settings = 'project_settings_singleton'
    project_settings = cache.get(cache_key_settings)
    
    if project_settings is None:
        project_settings = ProjectSettings.objects.prefetch_related(
            'advantages', 'social_links'
        ).first()
        
        cache.set(cache_key_settings, project_settings, 86400)
    
    
    # cache_version_key = 'footer_menu_version'
    # version = cache.get(cache_version_key, 1)
    # cache_key_menu = f'footer_menu_items:v{version}'
    
    # footer_menu_items_list = cache.get(cache_key_menu)
    
    # if footer_menu_items_list is None:
    #     PRODUCT_CATEGORY_TYPE_IDS = getattr(settings, 'PRODUCT_CATEGORY_TYPE_IDS', [])
    #     MAX_HEADER_MENU_ITEMS = getattr(settings, 'MAX_HEADER_MENU_ITEMS', 10)
        
    #     footer_menu_items_list = list(MenuCatalog.objects.filter(
    #         show_footer_rigth=True,
    #         is_hidden=False,
    #         type_menu_id__in=PRODUCT_CATEGORY_TYPE_IDS
    #     ).only('name', 'slug').order_by('order_number')[:MAX_HEADER_MENU_ITEMS])
        
    #     cache.set(cache_key_menu, footer_menu_items_list, 86400) # 1 Day

    
    current_filial = request.filial


    contact_phone = ""
    contact_email = ""
    contact_address = ""
    map_code = ""
    main_working_hours = ""

    if project_settings:
        contact_phone = project_settings.main_phone
        contact_email = project_settings.main_email
        contact_address = project_settings.main_address
        contact_map_code = project_settings.main_map_code
        contact_working_hours = project_settings.main_working_hours

    
    if current_filial:
        contact_phone = current_filial.phone or contact_phone
        contact_email = current_filial.email or contact_email
        contact_address = current_filial.address or contact_address
        contact_map_code = current_filial.map_code or contact_map_code
        contact_working_hours = current_filial.working_hours or contact_working_hours


    footer_menu_items_list = MenuCatalog.objects.filter(
        show_footer_rigth=True,
        is_hidden=False,
        type_menu_id__in=PRODUCT_CATEGORY_TYPE_IDS).only(
        'id', 'name', 'slug', 'order_number'
    ).order_by('order_number')[:MAX_HEADER_MENU_ITEMS] 

    current_year = datetime.date.today().year
    site_name_from_db = project_settings.site_name if project_settings else settings.SITE_NAME
    start_year = project_settings.start_year
    url_site = settings.SITE_NAME 
    current_url = request.build_absolute_uri()
    version_name = settings.VERSION_NAME
    site_header = settings.SITE_NAME
    site_title = f"{site_header} {version_name}"
    media_url = settings.MEDIA_URL
    static_url = settings.STATIC_URL
    current_timestamp_for_form = str(timezone.now().timestamp())

    context = {
        'current_year': current_year,
        'project_settings': project_settings,
        'site_name': site_name_from_db,
        'start_year': start_year,
        'url_site': url_site,
        'current_url': current_url,
        'version_name': version_name,
        'site_header': site_header,
        'site_title': site_title,
        'media_url': media_url,
        'static_url': static_url,
        'form_render_timestamp_value': current_timestamp_for_form,
        'current_filial': current_filial,
        'footer_menu_items_list': footer_menu_items_list,
        'contact_phone': contact_phone,
        'contact_email': contact_email,
        'contact_address': contact_address,
        'contact_map_code': contact_map_code,
        'contact_working_hours':contact_working_hours,
    }
    
    return context


# def filial_context(request):
#     """
#     Prépare et précharge les données des filiales pour une utilisation
#     performante dans les templates.
#     """
#     all_filials = Filial.objects.filter(is_hidden=False)
#     return {
#         'all_filials': all_filials,
#         'current_filial': request.filial,
#     }

def filial_context(request):
    """
    Rend la filiale actuelle et la liste de toutes les filiales actives
    disponibles dans tous les templates, en utilisant le cache pour la performance.
    """
    cache_key = 'all_active_filials_list'
    
    all_filials = cache.get(cache_key)
    
    if all_filials is None:
        all_filials = list(Filial.objects.filter(is_hidden=False))
        cache.set(cache_key, all_filials, 3600)
    
    return {
        'all_filials': all_filials,
        'current_filial': getattr(request, 'filial', None),
    }


def cart_context(request):
    """
    Rend l'objet cart, le nombre d'articles uniques et une liste
    d'IDs de produits disponibles dans le contexte de tous les templates.
    """
    cart = CartManager(request)

    cart_data_from_session = request.session.get(settings.CART_SESSION_ID)
    
    cart_data = cart.get_cart_data()
    
    # product_id_strings = cart_data.keys()
    
    # cart_product_ids = [int(pid) for pid in product_id_strings]

    cart_product_ids = [int(pid) for pid in cart_data.keys()]
    
    cart_items_count = len(cart_product_ids)

    # # --- Log pour débogage ---
    # print(f"Context Processor - Product IDs in Cart: {cart_product_ids}")
    # print(f"Context Processor - Unique Items Count: {cart_items_count}")
    # # ------------------------

    # print(f"[CONTEXT_PROCESSOR] Données du panier trouvées dans la session : {cart_data_from_session}")

    return {
        'cart_object': cart,
        'cart_data': cart_data, 
        'cart_unique_items_count': cart_items_count,
        'cart_product_ids': cart_product_ids,
    }



def page404(request, exception):
    """
    Handler 404 personnalisé. Ajoute toujours une balise noindex pour le SEO.
    """
    context = {
        'is_generic_error_404': True,
        'noindex': True,
    }
    response = render(request, 'catalog/404.html', context)
    response.status_code = 404
    return response


def page500(request):
	is_generic_error_500 = True
	response = render(request, 'catalog/500.html', {'is_generic_error_500': is_generic_error_500} )
	response.status_code = 500
	return response


