from django.db import models
from django.utils.text import slugify
from unidecode import unidecode
from apps.filial.models import Filial
from .managers import ProductManager
from apps.gallery.models import GalleryImage
from apps.utils.image_utils import process_and_convert_image
from django.core.exceptions import ValidationError
from django.urls import reverse, NoReverseMatch
from django_ckeditor_5.fields import CKEditor5Field
from decimal import Decimal
from collections import defaultdict

import random
import string
import time
import uuid

from django.contrib.postgres.search import SearchVectorField, SearchVector
from django.contrib.postgres.indexes import GinIndex


import logging 
logger = logging.getLogger(__name__)


class FilterCategory(models.Model):
    """
    Категория фильтра, которая группирует значения.
    Например: 'Производитель', 'Цвет', 'Материал'.
    """
    name = models.CharField("Название фильтра", max_length=100, unique=True)
    slug = models.SlugField("Ключ для URL", max_length=100, unique=True, help_text="Используется в URL (латиница, цифры, дефис)")
    order = models.PositiveIntegerField("Порядок", default=100, help_text="Порядок отображения в списке фильтров")
    unit = models.CharField("Единица измерения", max_length=20, blank=True, help_text="(Напр., 'мм', 'кг')")

    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Категория фильтра"
        verbose_name_plural = "Категории фильтров"

    def __str__(self):
        return self.name

class FilterValue(models.Model):
    """
    Конкретное значение внутри категории фильтра.
    Например: 'Aquaviva' (для Производителя), 'Красный' (для Цвета).
    """
    category = models.ForeignKey(FilterCategory, verbose_name="Категория фильтра", related_name='values', on_delete=models.CASCADE)
    value = models.CharField("Значение", max_length=255, db_index=True)
    slug = models.SlugField("Ключ для URL", max_length=255, blank=True)
    order = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        ordering = ['category__order', 'category__name', 'order', 'value']
        unique_together = ('category', 'slug')
        verbose_name = "Значение фильтра"
        verbose_name_plural = "Значения фильтров"

    def __str__(self):
        return f"{self.category.name}: {self.value}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(unidecode(self.value))
        super().save(*args, **kwargs)



class Product(models.Model):
    """
    Основная модель продукта в каталоге.
    Содержит общую информацию, не зависящую от филиала.
    """

    # --- CONSTANTES POUR LES TYPES DE PRIX ---
    PRICE_TYPE_FIXED = 'fixed'
    PRICE_TYPE_FROM = 'from'
    PRICE_TYPE_CHOICES = [
        (PRICE_TYPE_FIXED, 'фикс'),
        (PRICE_TYPE_FROM, 'от'),
    ]

    base_name = models.CharField("Базовое название", max_length=200, blank=True, help_text="Основное название без характеристик, напр., 'Канат одинарной свивки'")
    title = models.CharField("Полное название", max_length=512, db_index=True, help_text="Название ручное")
    slug = models.SlugField("URL-ключ (слаг)", max_length=255, unique=True, db_index=True, blank=True)
    sku = models.CharField("Артикул (SKU)", max_length=100, unique=True, db_index=True, blank=True, help_text="Генерируется автоматически при сохранении, если пустое.")
    category = models.ForeignKey("menu.MenuCatalog", verbose_name="Категория", on_delete=models.PROTECT, related_name="products")
    description = CKEditor5Field(config_name="extends", verbose_name="Описание", blank=True, null=True)
    base_price = models.DecimalField("Базовая цена", max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="Цена по умолчанию, если не переопределена в филиале.") 
    price_type = models.CharField("Тип цены", max_length=10, choices=PRICE_TYPE_CHOICES, default=PRICE_TYPE_FROM, help_text="Определяет, как отображается цена (например, 'от 2000 ₽').")    
    unit = models.CharField("Единица измерения", max_length=50, blank=True, help_text="напр., шт, кг, м²")
    filters = models.ManyToManyField(FilterValue, verbose_name="Значения фильтров", related_name="products", blank=True)
    is_hidden = models.BooleanField("Скрыть", default=False, db_index=True, help_text="Скрыть товар со всего сайта.")
    is_hit = models.BooleanField("Хит продаж", default=False, db_index=True, help_text="Показывать в блоке 'Хиты' на главной.")
    created_at = models.DateTimeField("Создано", auto_now_add=True, editable=False)
    updated_at = models.DateTimeField("Обновлено", auto_now=True, editable=False)
    order_number = models.PositiveIntegerField("Порядок", default=100)
    search_vector = SearchVectorField(null=True, editable=False)
    
    seo_title = models.CharField("SEO Заголовок (Title)", max_length=255, blank=True)
    seo_description = models.TextField("SEO Описание (Description)", blank=True)
    seo_keywords = models.TextField(verbose_name="Ключевые слова (мета)", blank=True, null=True)
    
    related_services = models.ManyToManyField(
        'Service', 
        verbose_name="Сопутствующие услуги",
        blank=True,
        related_name="products_offered_with",
        help_text="Выберите услуги, которые будут предложены с этим товаром."
    )
    

    objects = ProductManager()

    class Meta:
        ordering = ["order_number"]
        verbose_name = "Продукт"
        verbose_name_plural = "Продукты"
        indexes = [
            GinIndex(fields=['search_vector'], name='product_search_vector_idx'),
        ]
            

    @property
    def full_title(self):
        """
        Retourne le titre à afficher sur le site.
        Priorise le 'title' manuel, et se rabat sur le 'base_name'.
        """
        if self.title and self.title.strip():
            return self.title
        return self.base_name

    def get_suggested_title(self):
        """Construit un titre suggéré à partir du nom de base et des filtres."""
        parts = [self.base_name or self.title or ""]
        if self.pk:
            for fv in self.filters.select_related('category').order_by('category__order'):
                value, unit = fv.value, fv.category.unit
                parts.append(f"{value} {unit}" if unit else value)
        return " ".join(filter(None, parts))

    def _generate_unique_sku(self):
        """Génère un SKU numérique unique."""
        category_id_part = str(self.category_id or '0').zfill(3)
        timestamp_part = str(int(time.time() * 1000))[-6:]
        random_part = str(random.randint(100, 999))
        potential_sku = f"{category_id_part}{timestamp_part}{random_part}"
        while Product.objects.filter(sku=potential_sku).exists():
            random_part = str(random.randint(100, 999))
            potential_sku = f"{category_id_part}{timestamp_part}{random_part}"
        return potential_sku

    def _generate_unique_slug(self):
        """
        Génère un slug unique basé sur le titre et le SKU.
        Cette méthode est maintenant autonome et n'a pas besoin d'arguments.
        """
        base_for_slug = self.title
        if not base_for_slug:
            return self.sku or f"product-{uuid.uuid4().hex[:8]}"

        potential_slug = slugify(unidecode(base_for_slug))
        
        queryset = Product.objects.filter(slug=potential_slug)
        if self.pk:
            queryset = queryset.exclude(pk=self.pk)

        if queryset.exists():
            return f"{potential_slug}-{self.sku}"
        
        return potential_slug

    def save(self, *args, **kwargs):
        """
        Orchestre la sauvegarde et la génération des champs.
        Le SLUG est généré une seule fois et reste stable.
        """
        if not self.sku:
            self.sku = self._generate_unique_sku()

        if self.title == self.base_name and self.pk:
            self.title = self.get_suggested_title()
        elif not self.title and self.base_name:
            self.title = self.base_name
        
        if not self.slug:
            self.slug = self._generate_unique_slug()
        
        super().save(*args, **kwargs)

        vector = (
            SearchVector('base_name', weight='A', config='russian') +
            SearchVector('sku', weight='A', config='russian') +
            SearchVector('title', weight='B', config='russian') +
            SearchVector('description', weight='C', config='russian')
        )
        Product.objects.filter(pk=self.pk).update(search_vector=vector)

    def __str__(self):
        return self.full_title


    def get_price_for_filial(self, filial):
        """
        Récupérer le prix d'un produit
        en suivant la hiérarchie de filiales.
        """        
        if not filial:
            return self.base_price
        
        current_filial = filial
        
        while current_filial:
            filial_data = self.filial_data.filter(filial=current_filial).first()
            
            if filial_data:
                if filial_data.price is not None:
                    return filial_data.price
            else:
                logger.debug("No specific data filial found.")

            current_filial = current_filial.parent
        
        return self.base_price
    

    def get_structured_features(self):
        """
        Retourne les filtres du produit sous forme de dictionnaire {nom_categorie: [valeur1, valeur2]}.
        Cette méthode est optimisée pour fonctionner avec prefetch_related('filters__category').
        """
        # Utilise un cache sur l'instance pour éviter de recalculer si appelé plusieurs fois
        if hasattr(self, '_structured_features_cache'):
            return self._structured_features_cache

        features = defaultdict(list)
        # self.filters.all() utilisera le prefetch si disponible
        for fv in self.filters.all():
            features[fv.category.name].append(fv.value)
        
        # Stocker le résultat dans le cache de l'instance
        self._structured_features_cache = dict(features)
        return self._structured_features_cache

    # def get_absolute_url(self):
    #     return reverse('menu:product', kwargs={'product_slug': self.slug})
    def get_absolute_url(self):
        # On vérifie si l'instance est un Service ou un Product
        if hasattr(self, 'service'): # 'service' est le nom de la relation inverse créée par l'héritage
            return reverse('products:service_detail', kwargs={'slug': self.slug})
        # Par défaut, c'est un produit
        # Note: Assurez-vous d'avoir une URL nommée 'product_detail' quelque part
        return reverse('menu:product', kwargs={'product_slug': self.slug})



class ProductImage(models.Model):
    """
    Lie un Produit à une Image de la Galerie.
    Définit l'ordre et si c'est l'image principale.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images', verbose_name="Продукт")
    gallery_image = models.ForeignKey(GalleryImage, on_delete=models.CASCADE, related_name='product_links', verbose_name="Изображение из галереи", null=True, blank=True,)
    alt_text = models.CharField("Alt текст (для SEO)", max_length=255, blank=True)
    order = models.PositiveIntegerField("Порядок", default=0, db_index=True)
    is_main = models.BooleanField("Основное изображение", default=False, help_text="Если отмечено, это изображение будет использоваться как главное для продукта.")

    class Meta:
        ordering = ['order']
        verbose_name = "Изображение продукта"
        verbose_name_plural = "Изображения продуктов"

    @property
    def image(self):
        """
        Propriété pour accéder facilement à l'objet ImageField de la galerie.
        Permet de garder une compatibilité avec l'ancien code (ex: `product_image.image.url`).
        """
        if self.gallery_image:
            return self.gallery_image.image
        return None

    def clean(self):
        super().clean()
        if self.is_main and self.product_id:
            other_main_images = ProductImage.objects.filter(
                product_id=self.product_id, 
                is_main=True
            ).exclude(pk=self.pk)
            if other_main_images.exists():
                raise ValidationError("Для этого продукта уже установлено основное изображение.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class ProductFilialData(models.Model):
    """
    Хранит данные, специфичные для каждого филиала (цена, остатки).
    Создается только для переопределения базовых значений продукта.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="filial_data", verbose_name="Продукт")
    filial = models.ForeignKey(Filial, on_delete=models.CASCADE, related_name="product_data", verbose_name="Филиал")
    price = models.DecimalField("Цена для филиала", max_digits=10, decimal_places=2, null=True, blank=True, help_text="Оставьте пустым, чтобы использовать цену родительского филиала или базовую цену.")
    is_available = models.BooleanField("В наличии (для филиала)", default=True)

    class Meta:
        unique_together = ('product', 'filial')
        verbose_name = "Данные продукта по филиалу"
        verbose_name_plural = "Данные продуктов по филиалам"







class Service(Product):
    """
    Modèle pour les services. Hérite de Product pour pouvoir être traité
    comme un produit standard (ajout au panier, prix, etc.).
    """
    # Product a déjà: base_name, title, slug, sku, category, description,
    # base_price, price_type, is_hidden, etc.
    
    # On peut ajouter des champs spécifiques aux services si besoin
    # Par exemple :
    # duration = models.DurationField("Durée estimée", blank=True, null=True)

    class Meta:
        verbose_name = "Услуга"
        verbose_name_plural = "Услуги"

    def save(self, *args, **kwargs):
        # On peut surcharger des logiques si besoin. Par exemple, forcer une catégorie.
        # if not self.category_id:
        #     # Assurez-vous d'avoir une catégorie "Services" dans votre MenuCatalog
        #     service_category, _ = MenuCatalog.objects.get_or_create(name="Услуги", ...)
        #     self.category = service_category
        super().save(*args, **kwargs)