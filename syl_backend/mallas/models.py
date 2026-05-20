from django.db import models
from users.models import Usuario

class MallaLogistica(models.Model):
    FORMATO_CHOICES = [('xlsx', 'Excel'), ('pdf', 'PDF')]
    ESTADO_CHOICES  = [('activa', 'Activa'), ('archivada', 'Archivada'), ('procesando', 'Procesando')]

    nombre_ruta        = models.CharField(max_length=200)
    archivo            = models.FileField(upload_to='mallas/')
    formato            = models.CharField(max_length=10, choices=FORMATO_CHOICES)
    fecha_distribucion = models.DateField()
    fecha_carga        = models.DateTimeField(auto_now_add=True)
    cargado_por        = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    estado             = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='procesando')
    observaciones      = models.TextField(blank=True)
    total_sedes        = models.IntegerField(default=0)
    total_unidades     = models.IntegerField(default=0)

    class Meta:
        ordering = ['-fecha_carga']

    def __str__(self):
        return f'{self.nombre_ruta} — {self.fecha_carga.date()}'

class Sede(models.Model):
    malla           = models.ForeignKey(MallaLogistica, on_delete=models.CASCADE, related_name='sedes')
    nombre          = models.CharField(max_length=300)
    institucion     = models.CharField(max_length=300, blank=True)   # ← nuevo
    municipio       = models.CharField(max_length=100, blank=True)   # renombrado de 'ciudad'
    ruta            = models.CharField(max_length=100, blank=True)
    aps             = models.IntegerField(default=0)                  # ← nuevo (APS total)
    cuota_asignada  = models.IntegerField(default=0)                  # total bolsas
    bolsas_cerdo_1  = models.IntegerField(default=0)                  # ← nuevo
    bolsas_cerdo_2  = models.IntegerField(default=0)                  # ← nuevo
    bolsas_res      = models.IntegerField(default=0)                  # ← nuevo
    bolsas_pollo_1  = models.IntegerField(default=0)                  # ← nuevo
    bolsas_pollo_2  = models.IntegerField(default=0)                  # ← nuevo
    bolsas_pollo_3  = models.IntegerField(default=0)                  # ← nuevo
    peso_total_kg   = models.DecimalField(max_digits=10, decimal_places=4, default=0)  # ← nuevo
    orden           = models.IntegerField(default=0)

    class Meta:
        ordering = ['orden']

    def __str__(self):
        return f'{self.nombre} — {self.cuota_asignada} bolsas'

    