from rest_framework import serializers
from .models import OrdenProduccion

class OrdenProduccionSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.SerializerMethodField()
    malla_nombre      = serializers.SerializerMethodField()
    turno_display     = serializers.SerializerMethodField()
    estado_display    = serializers.SerializerMethodField()

    class Meta:
        model  = OrdenProduccion
        fields = [
            'id', 'codigo_orden', 'producto', 'malla', 'malla_nombre',
            'cantidad', 'turno', 'turno_display', 'estado', 'estado_display',
            'creado_por', 'creado_por_nombre', 'fecha_creacion'
        ]
        read_only_fields = ['codigo_orden', 'creado_por', 'fecha_creacion']

    def get_creado_por_nombre(self, obj):
        return str(obj.creado_por) if obj.creado_por else ''

    def get_malla_nombre(self, obj):
        return str(obj.malla) if obj.malla else ''

    def get_turno_display(self, obj):
        return obj.get_turno_display()

    def get_estado_display(self, obj):
        return obj.get_estado_display()