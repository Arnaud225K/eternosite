from django.shortcuts import render
from django.views.generic import ListView, DetailView
from .models import Product
from apps.menu.models import MenuCatalog
from apps.checkout.cart import CartManager


class ServiceListView(ListView):
    """ Affiche la liste de tous les services non cachés. """
    model = Product
    template_name = 'service/service.html'
    context_object_name = 'services'

    def get_queryset(self):
        # Votre queryset est déjà très bien optimisé.
        # return Service.objects.filter(is_hidden=False).order_by('order_number').prefetch_related('images')
        return Product.services.filter(is_hidden=False).order_by('order_number').prefetch_related('images')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        try:
            current_menu_is_uslugi = MenuCatalog.objects.get(slug='uslugi')
            context['current_menu'] = current_menu_is_uslugi
            context['ancestors'] = current_menu_is_uslugi.get_ancestors(include_self=True)
        except MenuCatalog.DoesNotExist:
            context['current_menu'] = None
            context['ancestors'] = []
            
        context['is_uslugi_page'] = True
        return context


class ServiceDetailView(DetailView):
    """ Affiche la page de détail d'un service. """
    model = Product
    template_name = 'service/p-service.html'
    context_object_name = 'current_service'

    def get_queryset(self):
        return Product.services.filter(is_hidden=False).prefetch_related('images__gallery_image')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        current_service = context['current_service'] 
        current_filial = self.request.filial

        current_service.display_price = current_service.get_price_for_filial(current_filial)

        # --- BLOC AJOUTÉ : Vérification de la présence dans le panier ---
        cart = CartManager(self.request)
        cart_product_ids = [int(pid) for pid in cart.get_cart_data().keys()]
        context['is_in_cart'] = current_service.id in cart_product_ids
        # --- FIN DU BLOC ---

        if current_service.category:
            context['current_menu'] = current_service.category
            context['ancestors'] = current_service.category.get_ancestors(include_self=True)
        else:
            context['current_menu'] = None
            context['ancestors'] = []
        
        return context