from django.db import models
from django.db.models.functions import Coalesce

class FilialManager(models.Manager):
    def get_queryset(self):
        """
        Surcharge le queryset de base pour inclure un champ d'ordre calculé
        et trier les résultats en fonction de celui-ci.
        """
        queryset = super().get_queryset().annotate(
            order_val=Coalesce('order_number', 99999)
        )
        
        return queryset.order_by('order_val', 'name')