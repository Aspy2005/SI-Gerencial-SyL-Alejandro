from django.urls import path
from . import views

urlpatterns = [
    path('lotes/',           views.lotes_en_revision, name='calidad-lotes'),
    path('<int:pk>/aprobar/', views.aprobar_lote,      name='calidad-aprobar'),
    path('<int:pk>/rechazar/', views.rechazar_lote,    name='calidad-rechazar'),
    path('mermas/',           views.mermas_turno,      name='calidad-mermas'),
]