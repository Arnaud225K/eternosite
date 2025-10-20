from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    path('uslugi/', views.ServiceListView.as_view(), name='service_list'),
    
    path('uslugi/<slug:slug>/', views.ServiceDetailView.as_view(), name='service_detail'),
]