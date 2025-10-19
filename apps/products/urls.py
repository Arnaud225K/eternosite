from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    path('uslugi/', views.UslugiListView.as_view(), name='service_list'),
    
    path('uslugi/<slug:slug>/', views.UslugiDetailView.as_view(), name='service_detail'),
]