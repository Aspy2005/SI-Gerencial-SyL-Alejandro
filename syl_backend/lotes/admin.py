from django.contrib import admin
from .models import Lote

@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ['codigo_lote', 'producto', 'cantidad', 'estado', 'orden_envio', 'fecha_creacion']
    list_filter  = ['estado']
    ordering     = ['orden_envio']