from django.urls import path
from . import views

app_name = 'search'

urlpatterns = [
    path('live-search/', views.live_search_api, name='live_search'),
    path('', views.FullSearchView.as_view(), name='full_search'),
]