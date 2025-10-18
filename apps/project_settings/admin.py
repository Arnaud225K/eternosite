from django.contrib import admin
from solo.admin import SingletonModelAdmin
from .models import ProjectSettings, SocialLink, Advantage
from django.contrib.admin.models import LogEntry
from rangefilter.filters import DateRangeFilterBuilder

class SocialLinkInline(admin.TabularInline):
    model = SocialLink
    extra = 1 
    fields = ('order_number', 'display_svg_icon', 'icon_image', 'name', 'icon_name', 'is_hidden')
    readonly_fields = ('display_svg_icon',)
    ordering = ('order_number',)


class AdvantageInline(admin.TabularInline):
    model = Advantage
    extra = 1 
    fields = ('order_number', 'title', 'description', 'icon', 'is_hidden')
    ordering = ('order_number',)

@admin.register(ProjectSettings)
class ProjectSettingsAdmin(SingletonModelAdmin):
    inlines = [SocialLinkInline, AdvantageInline,]

    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'site_name', 'logo')
        }),
        ('О компании', {
            'fields': ('type_company', 'count_staff', 'start_year')
        }),
        ('Глобальные контактные данные', {
            'description': "Эти данные будут использоваться, если для конкретного филиала не указаны свои.",
            'fields': ('main_phone', 'main_email', 'main_address', 'main_working_hours', 'main_map_code')
        }),
        ('Дополнительные скрипты', {
            'classes': ('collapse',),
            'fields': ('robots_txt_default', 'text_head', 'text_body'),
            'description': 'Внимание! Неправильное использование этих полей может нарушить работу сайта.'
        }),
    )

@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ('name', 'order_number', 'is_hidden', 'display_svg_icon')
    list_filter = ('is_hidden',)


@admin.register(Advantage)
class AdvantageAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'title', 'description', 'icon', 'is_hidden')
    list_filter = ('is_hidden',)




#Custom Journal on admin site (LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    list_display = ('action_flag', 'user', 'content_type', 'object_repr', 'get_change_message', 'action_time')
    search_fields = ('user__username', 'content_type__model','object_repr',)
    list_filter = ('action_flag', ('action_time', DateRangeFilterBuilder()),)
admin.site.register(LogEntry, LogEntryAdmin)