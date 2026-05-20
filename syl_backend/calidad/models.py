from django.db import models
from django.conf import settings
from lotes.models import Lote, Merma


class RevisionCalidad(models.Model):

    ESTADOS = [
        ('pendiente',  'Pendiente'),
        ('aprobado',   'Aprobado'),
        ('rechazado',  'Rechazado'),
    ]

    lote = models.OneToOneField(
        Lote,
        on_delete=models.CASCADE,
        related_name='revision_calidad'
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='pendiente'
    )

    observaciones = models.TextField(blank=True, null=True)
    motivo_rechazo = models.TextField(blank=True, null=True)

    revisado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )

    fecha_revision = models.DateTimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.lote.codigo_lote} — {self.estado}'