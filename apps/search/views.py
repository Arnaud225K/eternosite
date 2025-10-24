from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from django.core.paginator import Paginator
from django.db.models import F
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from apps.products.models import Product
from apps.menu.models import MenuCatalog
from .models import SearchLog
from django.template.loader import render_to_string
import urllib.parse


PRODUIT_SEARCH_LIST = 12


def live_search_api(request):
    query = request.GET.get('q', '').strip()
    results = []
    
    if len(query) < 3:
        return JsonResponse({'results': []})
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(',')[0]
    else:
        ip_address = request.META.get('REMOTE_ADDR')

    SearchLog.objects.create(query=query, ip_address=ip_address, filial=request.filial)

    search_query = SearchQuery(query, config='russian', search_type='websearch')
    
    # 1. RECHERCHE DANS LES PRODUITS
    products = Product.objects.annotate(
        # On calcule un score de pertinence ('rank')
        rank=SearchRank(F('search_vector'), search_query)
    ).filter(
        # On ne garde que les produits qui correspondent à la requête
        search_vector=search_query,
        is_hidden=False
    ).order_by('-rank')[:5]

    for product in products:
        results.append({
            'type': 'product',
            'title': product.full_title,
            'url': product.get_absolute_url(),
            'image_url': product.images.first().image.url if product.images.first() else ""
        })

    # 2. RECHERCHE DANS LES CATÉGORIES (__icontains)
    categories = MenuCatalog.objects.filter(
        name__icontains=query,
        is_hidden=False
    )[:3]

    for category in categories:
        results.append({
            'type': 'category',
            'title': category.name,
            'url': category.get_absolute_url(),
            'image_url': category.image.url if category.image else ""
        })
    
    return JsonResponse({'results': results})




class FullSearchView(View):
    template_name = 'search/results.html'
    paginate_by = PRODUIT_SEARCH_LIST

    def get(self, request, *args, **kwargs):
        query = request.GET.get('q', '').strip()
        
        products_qs = Product.objects.none()
        categories_qs = MenuCatalog.objects.none()
        
        if len(query) >= 3:
            search_query = SearchQuery(query, config='russian', search_type='websearch')
            products_qs = Product.objects.annotate(
                rank=SearchRank(F('search_vector'), search_query)
            ).filter(
                search_vector=search_query,
                is_hidden=False
            ).order_by('-rank').prefetch_related('images', 'filial_data__filial')

            categories_qs = MenuCatalog.objects.filter(
                name__icontains=query,
                is_hidden=False,
            ).order_by('name')

        paginator = Paginator(products_qs, self.paginate_by)
        page_number = request.GET.get('page')
        products_page_obj = paginator.get_page(page_number)
        
        current_filial = request.filial
        for product in products_page_obj.object_list:
            product.display_price = product.get_price_for_filial(current_filial)
            
        h1_title = f"Результаты поиска по запросу «{query}»"


        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'
        if is_ajax:
            html_products = render_to_string(
                'includes/partials/_products_partial.html', 
                {'products_list': products_page_obj, 'request': request},
                request=request
            )
            html_pagination = render_to_string(
                'includes/partials/_pagination_partial.html',
                {'products_list': products_page_obj, 'request': request}
            )
            
            url_params = {'q': query}
            if products_page_obj.number > 1:
                url_params['page'] = products_page_obj.number
            new_url = f"{request.path}?{urllib.parse.urlencode(url_params)}"

            return JsonResponse({
                'html_products': html_products,
                'html_pagination': html_pagination,
                'h1_title': h1_title,
                'new_url': new_url,
            })

        context = {
            'h1_title': h1_title,
            'search_query': query,
            'found_products': products_page_obj,
            'found_categories': categories_qs,
            'is_search_page': True,
        }
        
        return render(request, self.template_name, context)
    

