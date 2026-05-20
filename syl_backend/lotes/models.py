from django.db import models
from django.conf import settings
import uuid


class Lote(models.Model):

    ESTADOS = [
        ('generado',   'Generado'),
        ('enviado',    'Enviado'),
        ('error_api',  'Error API'),
        ('completado', 'Completado'),
    ]

    CALIDAD_ESTADOS = [
        ('pendiente',  'Pendiente'),
        ('aprobado',   'Aprobado'),
        ('rechazado',  'Rechazado'),
    ]

    codigo_lote = models.CharField(
        max_length=100,
        unique=True,
        blank=True
    )

    orden = models.IntegerField(
        null=True,
        blank=True
    )

    producto = models.CharField(max_length=120)

    cantidad = models.IntegerField()

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='generado'
    )

    orden_envio = models.IntegerField(default=1)

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)

    bartender_resp = models.TextField(blank=True, null=True)

    fecha_envio_bt = models.DateTimeField(null=True, blank=True)

    # ── Calidad ──────────────────────────────────────────
    calidad_estado = models.CharField(
        max_length=20,
        choices=CALIDAD_ESTADOS,
        default='pendiente'
    )
    calidad_obs = models.TextField(blank=True, null=True)
    calidad_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='lotes_revisados'
    )
    calidad_fecha = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.codigo_lote:
            self.codigo_lote = f"LOT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.codigo_lote


class Bolsa(models.Model):

    lote = models.ForeignKey(
        Lote,
        related_name='bolsas',
        on_delete=models.CASCADE
    )

    codigo_bolsa = models.CharField(max_length=50, unique=True)

    codigo_barras = models.CharField(max_length=120, unique=True)

    serial = models.CharField(max_length=120)

    sede = models.CharField(max_length=150)

    ciudad = models.CharField(max_length=120)

    ruta = models.CharField(max_length=120)

    peso = models.FloatField(default=0)

    destinatario = models.CharField(max_length=200, blank=True, null=True)

    direccion = models.TextField(blank=True, null=True)

    impresa = models.BooleanField(default=False)

    escaneada = models.BooleanField(default=False)

    fecha_escaneo = models.DateTimeField(null=True, blank=True)

    escaneada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='bolsas_escaneadas'
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.codigo_bolsa


class Merma(models.Model):

    bolsa = models.ForeignKey(
        Bolsa,
        on_delete=models.SET_NULL,
        null=True,
        related_name='mermas'
    )
    lote = models.ForeignKey(
        Lote,
        on_delete=models.CASCADE,
        related_name='mermas'
    )
    codigo_barras = models.CharField(max_length=120)
    sede          = models.CharField(max_length=150)
    motivo        = models.CharField(max_length=200)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Merma {self.codigo_barras} — {self.motivo}'