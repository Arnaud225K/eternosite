
import os
from django.core.files.storage import FileSystemStorage
from eternoprom import settings
from urllib.parse import urljoin
from datetime import datetime

from django.utils.html import format_html
from django.templatetags.static import static

from django.contrib import messages
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMessage, message
from django.conf import settings
from django.contrib.humanize.templatetags.humanize import intcomma
from decimal import Decimal
from django.core.paginator import Paginator
from io import BytesIO
from PIL import Image
from django.core.files.base import ContentFile
from django.db.models import Count, Q
from collections import defaultdict
import urllib.parse
from apps.products.models import Product, FilterValue, FilterCategory
import uuid
from django.utils.text import slugify
from unidecode import unidecode

from django.core.cache import cache


import logging

logger = logging.getLogger(__name__)

DEFAULT_ADMIN_ICON_PLACEHOLDER = getattr(settings, 'DEFAULT_ADMIN_IMAGE_PLACEHOLDER', 'img/images/default_image.webp')




class CkeditorCustomStorage(FileSystemStorage):
    """
    Stockage personnalisé pour les fichiers uploadés via CKEditor 5.
    Sauvegarde les fichiers dans un sous-dossier avec un nom de fichier unique et nettoyé.
    """
    location = os.path.join(settings.MEDIA_ROOT, 'uploads/ckeditor/')
    base_url = os.path.join(settings.MEDIA_URL, 'uploads/ckeditor/')

    def _save(self, name, content):
        original_name, ext = os.path.splitext(name)
        
        clean_name = slugify(unidecode(original_name))
        unique_suffix = uuid.uuid4().hex[:6]
        
        safe_ext = ext if ext.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp'] else '.jpg'
        
        new_name = f"{clean_name}-{unique_suffix}{safe_ext}"
        
        return super()._save(new_name, content)


def get_admin_image_thumbnail_html(instance, image_field_name='image', alt_text_base="Изображение", width=50, height=50):
    """
    Génère le HTML pour une miniature d'image pour l'admin Django.
    Gère les images manquantes et les erreurs.

    Args:
        instance: L'instance du modèle (ex: un objet Product ou MenuCatalog).
        image_field_name (str): Le nom de l'attribut ImageField/FileField sur l'instance.
        alt_text_base (str): Texte de base pour l'attribut alt/title.
        width (int): Largeur de la miniature.
        height (int): Hauteur de la miniature.

    Returns:
        str: Une chaîne HTML sûre (via format_html) ou un texte de fallback.
    """
    image_url = None
    alt_text = alt_text_base
    try:
        image_field = getattr(instance, image_field_name, None)
        if image_field and hasattr(image_field, 'url'):
            try:
                image_url = image_field.url
            except ValueError:
                logger.warning(f"Model {instance.__class__.__name__} PK {instance.pk}: File missing for ImageField '{image_field_name}' ({getattr(image_field, 'name', 'N/A')})")
                image_url = None 

        if image_url:
            final_html = format_html(
                '<img src="{}" width="{}" height="{}" alt="{}" style="object-fit:contain; vertical-align: middle; border-radius: 4px;" />',
                image_url, width, height, alt_text,)
        else:
            try:
                placeholder_url = static(DEFAULT_ADMIN_ICON_PLACEHOLDER)
                final_html = format_html(
                    '<img src="{}" width="{}" height="{}" alt="Нет изображения" title="Нет изображения" style="object-fit:contain; vertical-align: middle; filter: grayscale(80%); opacity: 0.7;" />',
                    placeholder_url, width, height
                )
            except Exception as e_static:
                logger.error(f"Could not find default static placeholder image '{DEFAULT_ADMIN_ICON_PLACEHOLDER}': {e_static}")
    except Exception as e_main:
        logger.error(f"Error generating thumbnail for {instance.__class__.__name__} PK {instance.pk}, field '{image_field_name}': {e_main}", exc_info=True)
    return final_html



def get_admin_product_image_thumbnail_html(obj, image_field_name='image', alt_text_base="Image"):
    """
    Fonction réutilisable pour afficher une miniature d'image dans l'admin Django.
    
    Elle cherche l'image principale (`is_main=True`) sur le produit, ou la première image
    disponible, ou une image directement sur l'objet lui-même.
    
    Args:
        obj: L'objet de modèle (ex: un produit).
        image_field_name (str): Le nom du champ ImageField sur l'objet lui-même, si applicable.
        alt_text_base (str): Le texte de base pour l'attribut alt.
    """
    image_url = None
    
    if hasattr(obj, 'images'):
        main_image = obj.images.filter(is_main=True).first()
        if main_image:
            image_url = main_image.image.url
        else:
            first_image = obj.images.first()
            if first_image:
                image_url = first_image.image.url

    if not image_url and hasattr(obj, image_field_name):
        image_field = getattr(obj, image_field_name)
        if image_field and hasattr(image_field, 'url'):
            image_url = image_field.url
            
    alt_text = f"{alt_text_base} {obj}"
    if image_url:
        return format_html(
            '<img src="{}" width="60" height="60" style="object-fit:cover; border-radius:4px;" alt="{}" />', 
            image_url, 
            alt_text
        )
    else:
        try:
            placeholder_url = static(DEFAULT_ADMIN_ICON_PLACEHOLDER)
            return format_html(
                '<img src="{}" width="60" height="60" style="opacity:0.5;" alt="Нет изображения" />', 
                placeholder_url
            )
        except Exception:
            return "Нет изображения"



def format_price_admin(price_value, currency_symbol="₽", default_text="—"):
    """
    Formate un prix pour l'affichage dans l'admin Django.
    Affiche un entier sans décimales, avec un séparateur pour les milliers, et un symbole monétaire.
    
    Exemples:
    - 12500.50 -> "12 500 ₽"
    - 999 -> "999 ₽"
    - None -> "—"
    """
    if price_value is None or price_value == '':
        return default_text

    try:
        price_decimal = Decimal(price_value)
        
        price_as_integer = price_decimal.quantize(Decimal('1'))
        
        formatted_number = intcomma(price_as_integer).replace(',', ' ')
        
        return format_html(f'{formatted_number} {currency_symbol}')
        
    except (TypeError, ValueError, AttributeError):
        return default_text


def format_price_with_type_admin(price_value, price_type=None, default_text="—"):
    """
    Formate un prix pour l'admin, en tenant compte du type de prix ('from').
    """
    if price_value is None or price_value == '':
        return default_text
        
    price_decimal = Decimal(price_value)
    
    if price_decimal == 0:
        return "Договорная"

    prefix = "от " if price_type == Product.PRICE_TYPE_FROM else ""
    
    try:
        price_int = int(price_decimal)
        formatted_number = f"{price_int:,}".replace(',', ' ')
        return f"{prefix}{formatted_number} ₽"
    except (ValueError, TypeError):
        return default_text



def send_notification(mail_subject, mail_template, context):
    from_email = settings.DEFAULT_FROM_EMAIL
    message = render_to_string(mail_template, context)
    if(isinstance(context['to_email'], str)):
        to_email = []
        to_email.append(context['to_email'])
    else:
        to_email = context['to_email']
    mail = EmailMessage(mail_subject, message, from_email, to=to_email)
    mail.content_subtype = "html"
    mail.send()



def send_html_email(subject, html_content, recipient_list, from_email=None, reply_to=None):
    """
    Fonction utilitaire robuste pour envoyer des emails HTML.
    Utilise des noms d'arguments standards.
    
    Args:
        subject (str): Le sujet de l'email.
        html_content (str): Le contenu HTML de l'email, déjà rendu.
        recipient_list (list): Une liste d'adresses email des destinataires.
        from_email (str, optional): Adresse de l'expéditeur. Utilise les settings par défaut sinon.
        reply_to (list, optional): Une liste d'adresses pour le champ Reply-To.
    """
    if from_email is None:
        from_email = settings.DEFAULT_FROM_EMAIL

    if not isinstance(recipient_list, (list, tuple)):
        logger.error(f"Invalid 'recipient_list' type: {type(recipient_list)}.")
        return False

    if not recipient_list:
        logger.error("Email not sent: 'recipient_list' is empty.")
        return False

    try:
        email = EmailMessage(
            subject=subject,
            body=html_content,
            from_email=from_email,
            to=recipient_list,
            reply_to=reply_to
        )
        email.content_subtype = "html"
        email.send()
        logger.info(f"Email '{subject}' sent successfully to: {', '.join(recipient_list)}")
        return True
    except Exception as e:
        logger.exception(f"Error sending email '{subject}' to {', '.join(recipient_list)}: {e}")
        return False



# FONCTIONS DE FILTRAGE

def parse_filters_from_segment(filter_segment):
    """
    Parse un segment d'URL comme "f/cat1=val1,val2/cat2=val3/" en un dictionnaire.
    """
    if not filter_segment:
        return {}
    
    active_filters = {}
    cleaned_segment = filter_segment.strip('/')
    if cleaned_segment.startswith('f/'):
        cleaned_segment = cleaned_segment[2:]
    
    pairs = cleaned_segment.split('/')
    for pair in pairs:
        if '=' in pair:
            key, values_str = pair.split('=', 1)
            values = [urllib.parse.unquote(v.strip()) for v in values_str.split(',') if v.strip()]
            if key.strip() and values:
                active_filters[key.strip()] = values
    return active_filters



def build_filter_url_segment(active_filters):
    """
    Construit le segment /f/cat1=val1,val2/cat2=val3/ à partir d'un dictionnaire.
    """
    if not active_filters:
        return ""
    
    parts = []
    for key in sorted(active_filters.keys()):
        values = sorted(active_filters[key])
        if values:
            encoded_values = [urllib.parse.quote(v) for v in values]
            parts.append(f"{key}={','.join(encoded_values)}")
    
    if not parts:
        return ""
    return "f/" + "/".join(parts) + "/"



def parse_filters_from_request(request_get_params):
    """
    Parse les filtres depuis request.GET (ex: ?proizvoditel=aquaviva&tsvet=belyy).
    Retourne un dictionnaire des filtres actifs.
    """
    active_filters = defaultdict(list)
    for key, value_list in request_get_params.lists():
        if key not in ['page', 'sort', 'q', 'category_slug']: 
            if value_list:
                active_filters[key].extend(v for v in value_list if v)
    return dict(active_filters)


def apply_filters_to_queryset(product_qs, active_filters_dict):
    """
    Applique un dictionnaire de filtres à un queryset de produits.
    """
    if not active_filters_dict:
        return product_qs
    
    for category_slug, value_slugs in active_filters_dict.items():
        if value_slugs:
            logger.debug(f"Applying filter to QS: category='{category_slug}', values IN {value_slugs}")
            
            product_qs = product_qs.filter(
                filters__category__slug=category_slug, 
                filters__slug__in=value_slugs
            )

    return product_qs.distinct()





def get_available_filters(category, base_queryset, active_filters):
    """
    Version Corrigée pour la Multi-sélection : Calcule la disponibilité de chaque groupe
    de filtres en ignorant les filtres actifs de ce même groupe.
    """
    final_filters_data = []
    
    all_applicable_filters = FilterCategory.objects.filter(
        menucatalog__in=category.get_descendants(include_self=True)
    ).distinct().prefetch_related('values').order_by('order', 'name')

    for cat_filter in all_applicable_filters:
        
        all_possible_values_for_category = cat_filter.values.filter(
            products__in=base_queryset
        ).distinct().order_by('value', 'pk')

        if not all_possible_values_for_category.exists():
            continue

        other_filters = {
            key: values 
            for key, values in active_filters.items() 
            if key != cat_filter.slug
        }
        
        qs_filtered_by_others = apply_filters_to_queryset(base_queryset, other_filters)
        
        available_slugs_set = set(
            FilterValue.objects.filter(
                category=cat_filter,
                products__in=qs_filtered_by_others
            ).values_list('slug', flat=True)
        )

        values_with_status = []
        for value in all_possible_values_for_category:
            values_with_status.append({
                'value': value,
                'is_available': value.slug in available_slugs_set
            })

        final_filters_data.append({
            'category': cat_filter,
            'values_with_status': values_with_status,
        })
            
    return final_filters_data



def get_active_filters_data(active_filters_dict):
    """
    Transforme le dictionnaire de slugs de filtres actifs en une liste
    d'objets avec les noms lisibles, prête pour le template.
    """
    if not active_filters_dict:
        return []

    active_filters_list = []
    q_objects = Q()
    for category_slug, value_slugs in active_filters_dict.items():
        q_objects |= Q(category__slug=category_slug, slug__in=value_slugs)

    filter_values = FilterValue.objects.filter(q_objects).select_related('category').order_by('category__name', 'value')

    for fv in filter_values:
        active_filters_list.append({
            'group_name': fv.category.name,
            'value_name': fv.value,
            'group_slug': fv.category.slug,
            'value_slug': fv.slug,
        })
        
    return active_filters_list




def get_active_filters_display_string(active_filters_dict):
    """
    Construit une chaîne lisible des filtres actifs.
    Exemple: "Производитель: Aquaviva, Цвет: Белый"
    """
    if not active_filters_dict:
        return ""

    parts = []
    
    q_objects = Q()
    for category_slug, value_slugs in active_filters_dict.items():
        q_objects |= Q(category__slug=category_slug, slug__in=value_slugs)
    
    filter_values = FilterValue.objects.filter(q_objects).select_related('category').order_by('category__order', 'value')
    
    grouped_values = {}
    for fv in filter_values:
        cat_name = fv.category.name
        if cat_name not in grouped_values:
            grouped_values[cat_name] = []
        grouped_values[cat_name].append(fv.value)
        
    for cat_name, values in grouped_values.items():
        parts.append(f"{cat_name}: {', '.join(values)}")

    return ", ".join(parts)




def minfirst(text):
    if not text:
        return ''
    return text[0].lower() + text[1:]