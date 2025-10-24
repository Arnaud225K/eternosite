from django.contrib import admin
from .models import StaticText

@admin.register(StaticText)
class StaticTextAdmin(admin.ModelAdmin):
    list_display = ('id', 'slug', 'display_filial', 'comment', 'text_preview',)
    list_display_links = ('id', 'slug',)
    list_filter = ('filial',)
    
    search_fields = ('slug', 'comment', 'text', 'filial__name')
    
    autocomplete_fields = ['filial']

    fields = ('slug', 'filial', 'comment', 'text')

    def display_filial(self, obj):
        """
        Affiche le nom de la filiale, ou "Глобальный" si aucune n'est liée.
        """
        if obj.filial:
            return obj.filial.name
        return "Глобальный (по умолчанию)"
    display_filial.short_description = "Область видимости"
    display_filial.admin_order_field = 'filial__name'

    def text_preview(self, obj):
        """
        Affiche un court aperçu du texte sans les balises HTML.
        """
        from django.utils.html import strip_tags
        from django.utils.text import Truncator
        
        if obj.text:
            return Truncator(strip_tags(obj.text)).chars(50)
        return "—"
    text_preview.short_description = "Анонс текста"