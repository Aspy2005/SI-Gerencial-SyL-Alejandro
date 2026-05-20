from django.db import models
from users.models import Usuario
from mallas.models import MallaLogistica

class OrdenProduccion(models.Model):
    TURNO_CHOICES  = [('manana', 'Mañana'), ('tarde', 'Tarde'), ('noche', 'Noche')]
    ESTADO_CHOICES = [
        ('pendiente',      'Pendiente'),
        ('programada',     'Programada'),
        ('en_produccion',  'En Producción'),
        ('completada',     'Completada'),
        ('cancelada',      'Cancelada'),
    ]

    codigo_orden    = models.CharField(max_length=50, unique=True)
    producto        = models.CharField(max_length=200)
    malla           = models.ForeignKey(MallaLogistica, on_delete=models.SET_NULL, null=True, related_name='ordenes')
    cantidad        = models.IntegerField()
    turno           = models.CharField(max_length=10, choices=TURNO_CHOICES)
    estado          = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    creado_por      = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    fecha_creacion  = models.DateTimeField(auto_now_add=True)
    fecha_inicio    = models.DateTimeField(null=True, blank=True)
    fecha_fin       = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f'{self.codigo_orden} — {self.producto}'

    def save(self, *args, **kwargs):
        if not self.codigo_orden:
            from django.utils import timezone
            año   = timezone.now().year
            count = OrdenProduccion.objects.filter(
                fecha_creacion__year=año
            ).count() + 1
            self.codigo_orden = f'OP-{año}-{count:03d}'
        super().save(*args, **kwargs)