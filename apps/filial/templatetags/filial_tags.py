from django import template
from django.conf import settings

register = template.Library()

@register.simple_tag(takes_context=True)
def get_filial_url(context, target_filial):
    """
    Construit l'URL complète pour une autre filiale de manière robuste.
    
    Exemple d'utilisation dans un template :
    {% load filial_tags %}
    <a href="{% get_filial_url autre_filiale %}">Lien vers une autre ville</a>
    """
    request = context.get('request')
    if not request or not target_filial:
        return '#'

    main_domain = getattr(settings, 'MAIN_DOMAIN', None)
    if not main_domain:
        host_parts = request.get_host().split('.')
        main_domain = '.'.join(host_parts[-2:]) if len(host_parts) > 1 else host_parts[0]

    if target_filial.is_default:
        new_host = main_domain
    else:
        new_host = f"{target_filial.subdomain}.{main_domain}"

    port = request.get_port()
    if port not in ('80', '443'):
        new_host = f"{new_host}:{port}"

    path_to_use = request.get_full_path()
    
    return f"//{new_host}{path_to_use}"