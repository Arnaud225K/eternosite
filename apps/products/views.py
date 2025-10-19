from django.shortcuts import render
from django.views.generic import ListView, DetailView
from .models import Service
from apps.menu.models import MenuCatalog

class UslugiListView(ListView):
    """ Affiche la liste de tous les services non cachés. """
    model = Service
    template_name = 'service/service.html'
    context_object_name = 'services'

    def get_queryset(self):
        # return Service.objects.filter(is_hidden=False).order_by('order_number')
        return Service.objects.filter(is_hidden=False).order_by('order_number').only(
            'title', 'slug', 'description'
        ).prefetch_related('images')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        try:
            current_menu_is_uslugi = MenuCatalog.objects.get(slug='uslugi')
            context['current_menu'] = current_menu_is_uslugi
            
        except MenuCatalog.DoesNotExist:
            pass
        context['is_uslugi_page'] = True
        return context


class UslugiDetailView(DetailView):
    model = Service
    template_name = 'service/p-service.html'
    context_object_name = 'service'

    def get_queryset(self):
        return super().get_queryset().filter(is_hidden=False)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # On passe la variable 'service' au contexte du fil d'ariane
        return context