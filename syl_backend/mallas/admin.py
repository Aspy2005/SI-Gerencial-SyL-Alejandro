from django.contrib import admin
from .models import MallaLogistica, Sede

class SedeInline(admin.TabularInline):
    model  = Sede
    extra  = 0

@admin.register(MallaLogistica)
class MallaAdmin(admin.ModelAdmin):
    list_display = ['nombre_ruta', 'formato', 'estado', 'total_sedes', 'total_unidades', 'fecha_carga']
    inlines      = [SedeInline]

@admin.register(Sede)
class SedeAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'malla', 'cuota_asignada', 'orden']