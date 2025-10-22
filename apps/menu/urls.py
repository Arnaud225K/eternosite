from django.urls import path , re_path

from django.views.decorators.cache import cache_page
from . import views

app_name = 'menu'

urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
    path('ajax/get-mega-menu/', views.AjaxMegaMenuView.as_view(), name='ajax_get_mega_menu'),
    # path('offers/<slug:slug>/', views.OfferCollectionDetailView.as_view(), name='offer_collection_detail'),
    path('product/<str:product_slug>/', views.ProductView.as_view(), name='product'),
    re_path(r'^api/filter/(?P<hierarchical_slug>[\w\/-]+)/(?P<filter_segment>f\/.*)$', views.FilterProductsAPIView.as_view(), name='api_filter_products_with_segment'),
    path('api/filter/<path:hierarchical_slug>/', views.FilterProductsAPIView.as_view(), name='api_filter_products'),
    re_path(r'^(?P<hierarchical_slug>[\w\/-]+)/(?P<filter_segment>f\/.*)$', views.MenuView.as_view(), name='menu_catalog_with_filters'),
    path('<path:hierarchical_slug>/', views.MenuView.as_view(), name='menu_catalog'),
]