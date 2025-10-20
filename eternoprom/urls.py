from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve
# from apps.filial.views import RobotsTxtView
from . import settings
import os
from django.conf.urls.static import static
from .settings import SITE_NAME
# from .views import page404, page500
# from .views import page404, page500
import logging
from apps.gallery.views import custom_ckeditor_upload

logger = logging.getLogger(__name__)

#Custom admin site
admin.site.site_header = SITE_NAME
admin.site.site_title = SITE_NAME


# handler404 = page404
# handler500 = page500


urlpatterns = [
    # path('novadmin/sitemap_gen/', include('apps.sitemap_gen.urls', namespace='sitemap_gen')),
    path('eternoadmin/', admin.site.urls),
]

#Activate debug toolbar url
if settings.DEBUG:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ]

urlpatterns += [
    # --- CUSTOM APP URL ---
    # path("robots.txt", RobotsTxtView.as_view()),
    # path('search/', include('apps.search.urls', namespace='search')),
    path('select2/', include('django_select2.urls')),
    # path('import-export/', include('apps.import_export.urls', namespace='import_export')),
    # path('uslugi/', include('apps.uslugi.urls', namespace='uslugi')),
    # path('articles/', include('apps.articles.urls', namespace='articles')),
    path('checkout/', include('apps.checkout.urls')),
    path('', include('apps.products.urls', namespace='products')),
    path('',include('apps.menu.urls')),
    # --- CUSTOM LIBRARY URL ---
    path("ckeditor5/image_upload/", custom_ckeditor_upload, name="ck_editor_5_upload_file"),

]

#Serve static files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)	
urlpatterns += [
        re_path(r'media/(?P<path>.*)$', serve, {'document_root': settings.WWW_ROOT}),
    ]

if hasattr(settings, 'WWW_ROOT') and settings.WWW_ROOT and os.path.isdir(settings.WWW_ROOT):
    sitemap_root_pattern = r'^(?P<path>sitemap(?:_[\w\.-]*)?\.xml(?:\.gz)?)$'
    urlpatterns += [
        re_path(sitemap_root_pattern, serve, {'document_root': settings.WWW_ROOT}),
    ]
else:
    logger.warning(f"Settings.WWW_ROOT ('{getattr(settings, 'WWW_ROOT', 'Not Set')}') is not a valid directory. Sitemaps at root won't be served by runserver.")