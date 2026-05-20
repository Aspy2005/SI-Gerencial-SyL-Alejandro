from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    ROL_CHOICES = [
        ('jefe_planta',     'Jefe de Planta'),
        ('operario',        'Operario'),
        ('analista_calidad','Analista de Calidad'),
    ]
    rol    = models.CharField(max_length=20, choices=ROL_CHOICES, default='operario')
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.username} ({self.get_rol_display()})'