from django.contrib import admin
# from .models import (Product, ProductImage, ProductFilialData, FilterCategory, FilterValue)
from .models import (Product, Service, ProductImage, ProductFilialData, FilterCategory, FilterValue)
from apps.utils.utils import format_price_admin, get_admin_product_image_thumbnail_html
from apps.menu.models import MenuCatalog, TypeMenu


PRODUCT_CATEGORY_TYPE_IDS = [7, 8]



class CategoryFilter(admin.SimpleListFilter):
	"""
	A custom filter to allow selecting a specific category (excluding uncategorized).
	"""
	title = 'Категория'
	parameter_name = 'category_id'

	def lookups(self, request, model_admin):
		categories = MenuCatalog.objects.filter(type_menu_id__in=PRODUCT_CATEGORY_TYPE_IDS).order_by('order_number')
		
		return [(category.id, category.name) for category in categories]

	def queryset(self, request, queryset):
		if self.value():
			return queryset.filter(category__id=self.value())
		return queryset


class FilterValueInline(admin.TabularInline):
    model = FilterValue
    extra = 1
    prepopulated_fields = {'slug': ('value',)}

@admin.register(FilterCategory)
class FilterCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'unit', 'order')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [FilterValueInline]
    search_fields = ('name', 'slug')


@admin.register(FilterValue)
class FilterValueAdmin(admin.ModelAdmin):
    list_display = ('value', 'category', 'order')
    list_filter = ('category',)
    search_fields = ('value', 'category__name')
    list_select_related = ('category',)
    autocomplete_fields = ['category']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('gallery_image', 'alt_text', 'is_main', 'order')

class ProductFilialDataInline(admin.TabularInline):
    model = ProductFilialData
    extra = 1
    fields = ('filial', 'price', 'is_available')
    autocomplete_fields = ['filial']



@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'sku', 'display_product_image', 'price_type', 'display_formatted_price', 'category', 'order_number', 'is_hidden', 'created_at', 'updated_at')

    list_filter = (CategoryFilter, 'is_hidden', 'price_type')
    search_fields = ('id','title', 'sku', 'description', 'category__name')
    filter_horizontal = ('filters',)
    list_display_links = ('id', 'title',)
    inlines = [ProductImageInline, ProductFilialDataInline]


    readonly_fields = ('created_at', 'updated_at', 'sku',)

    autocomplete_fields = ['filters']

    fieldsets = (
        ('Основная информация и Статус', 
            {'fields': (
                'base_name', 
                'title',
                'slug', 
                'sku',
                'order_number', 
                'category', 
                'is_hidden', 
                'is_hit',
                )
        }),
        ('Контент и Цены', {
            'fields': ('description', ('price_type', 'base_price'), 'unit',) 
        }),
        ('Статус и Фильтры', 
            {'fields': ( 'filters',)} 
        ),
    )


    def display_product_image(self, obj):
        return get_admin_product_image_thumbnail_html(obj, image_field_name='gallery_image', alt_text_base="Продукт")
    display_product_image.short_description = 'Картинка'

    def display_formatted_price(self, obj):
        """Affiche le prix formaté du produit dans list_display."""
        return format_price_admin(obj.base_price)
    display_formatted_price.short_description = 'Цена'
    display_formatted_price.admin_order_field = 'base_price'


    def get_queryset(self, request):
        """
        Optimise le chargement des données pour la liste des produits.
        """
        qs = super().get_queryset(request)
        # return qs.select_related('category').prefetch_related('images__gallery_image')
        return qs.select_related('category').prefetch_related('images__gallery_image').filter(service__isnull=True)
    



@admin.register(Service)
class ServiceAdmin(ProductAdmin):
    """
    Classe Admin pour les Services. Elle hérite de toutes les configurations de ProductAdmin,
    ce qui nous évite de tout réécrire.
    """
    
    def get_queryset(self, request):
        """
        S'assure que cette vue ne montre QUE les services.
        On utilise le queryset de base de ProductAdmin pour garder les optimisations.
        """
        # On ne peut pas appeler super().get_queryset() car il exclut les services.
        # On doit réimplémenter la base.
        qs = super(admin.ModelAdmin, self).get_queryset(request)
        return qs.select_related('category').prefetch_related('images__gallery_image')