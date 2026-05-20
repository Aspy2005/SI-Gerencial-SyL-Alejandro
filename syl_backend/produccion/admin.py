from django.contrib import admin
from .models import OrdenProduccion

@admin.register(OrdenProduccion)
class OrdenAdmin(admin.ModelAdmin):
    list_display = ['codigo_orden', 'producto', 'turno', 'estado', 'cantidad', 'fecha_creacion']
    list_filter  = ['estado', 'turno']