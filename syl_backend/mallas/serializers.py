from rest_framework import serializers
from .models import MallaLogistica, Sede

class SedeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Sede
        fields = [
            'id', 'nombre', 'institucion', 'municipio', 'ruta',
            'aps', 'cuota_asignada',
            'bolsas_cerdo_1', 'bolsas_cerdo_2', 'bolsas_res',
            'bolsas_pollo_1', 'bolsas_pollo_2', 'bolsas_pollo_3',
            'peso_total_kg', 'orden'
        ]

class MallaSerializer(serializers.ModelSerializer):
    sedes       = SedeSerializer(many=True, read_only=True)
    cargado_por = serializers.StringRelatedField(read_only=True)

    class Meta:
        model  = MallaLogistica
        fields = [
            'id', 'nombre_ruta', 'archivo', 'formato',
            'fecha_distribucion', 'fecha_carga', 'cargado_por',
            'estado', 'observaciones', 'total_sedes', 'total_unidades', 'sedes'
        ]
        read_only_fields = ['fecha_carga', 'cargado_por', 'estado', 'total_sedes', 'total_unidades']

class MallaUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MallaLogistica
        fields = ['nombre_ruta', 'archivo', 'formato', 'fecha_distribucion', 'observaciones']