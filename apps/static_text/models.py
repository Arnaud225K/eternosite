from django.db import models
from django_ckeditor_5.fields import CKEditor5Field
from apps.filial.models import Filial
from django.db.models import Q 
from django.core.exceptions import ValidationError



class StaticText(models.Model):
    slug = models.SlugField("Системный ключ (slug)", max_length=100, help_text="Уникальный идентификатор для использования в шаблонах, напр., 'homepage-cover-text'")
    filial = models.ForeignKey(Filial, on_delete=models.CASCADE, null=True, blank=True, verbose_name="Филиал", help_text="Оставьте пустым, если этот текст является глобальным по умолчанию.")
    text = CKEditor5Field(config_name='extends', verbose_name="HTML текст", blank=True, null=True, default="")
    comment = models.CharField("Комментарий для администратора", max_length=255, blank=True, null=True, default="")
    
    def __str__(self):
        if self.filial:
            return f"{self.slug} ({self.filial.name})"
        return f"{self.slug} (Глобальный)"

    def clean(self):
        
        super().clean()
        
        if self.filial is None:
            queryset = StaticText.objects.filter(slug=self.slug, filial__isnull=True)
            if self.pk:
                queryset = queryset.exclude(pk=self.pk)

            if queryset.exists():
                raise ValidationError({
                    'slug': 'Статический текст с таким системным ключом (slug) уже существует для глобального использования. Ключ должен быть уникальным.'
                })
        else:
            queryset = StaticText.objects.filter(slug=self.slug, filial=self.filial)
            if self.pk:
                queryset = queryset.exclude(pk=self.pk)

            if queryset.exists():
                raise ValidationError({
                    'slug': f'Статический текст с ключом "{self.slug}" уже существует для филиала "{self.filial.name}".'
                })

    class Meta:
        ordering = ["slug", "filial__name"]
        verbose_name = "Статический текст"
        verbose_name_plural = "Статические тексты"
        constraints = [
            models.UniqueConstraint(
                fields=['slug'], 
                condition=Q(filial__isnull=True),
                name='unique_global_static_text_slug'
            ),
            models.UniqueConstraint(
                fields=['slug', 'filial'],
                name='unique_filial_static_text_slug'
            )
        ]