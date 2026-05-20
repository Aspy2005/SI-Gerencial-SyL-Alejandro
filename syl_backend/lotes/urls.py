# lotes/urls.py
from django.urls import path
from .views import (
    LoteListView, LoteDetailView,
    enviar_a_bartender, enviar_todos_bartender,
    escanear_bolsa, registrar_merma, progreso_lote,
    inventario_operativo, lista_para_liberacion, liberar_stock,
)
from .trazabilidad_views import trazabilidad_buscar, trazabilidad_lote
from .views import progreso_global
from .actividad_views import actividad_reciente
from .views import actividad_reciente
urlpatterns = [
    path('',                        LoteListView.as_view(),       name='lote_list'),
    path('<int:pk>/',               LoteDetailView.as_view(),     name='lote_detail'),
    path('<int:pk>/bartender/',     enviar_a_bartender,           name='enviar_bartender'),
    path('bartender/enviar-todos/', enviar_todos_bartender,       name='enviar_todos'),
    path('escanear/',               escanear_bolsa,               name='escanear_bolsa'),
    path('merma/',                  registrar_merma,              name='registrar_merma'),
    path('<int:pk>/progreso/',      progreso_lote,                name='progreso_lote'),
    path('inventario/',             inventario_operativo,         name='inventario_operativo'),
    path('liberacion/',             lista_para_liberacion,        name='lista_liberacion'),
    path('<int:pk>/liberar/',       liberar_stock,                name='liberar_stock'),
    path('trazabilidad/',           trazabilidad_buscar,          name='trazabilidad_buscar'),
    path('<int:pk>/trazabilidad/',  trazabilidad_lote,            name='trazabilidad_lote'),
    path('progreso-global/', progreso_global, name='progreso_global'),
    path('actividad/', actividad_reciente, name='actividad_reciente'),
    path('lotes/actividad/', actividad_reciente),
]