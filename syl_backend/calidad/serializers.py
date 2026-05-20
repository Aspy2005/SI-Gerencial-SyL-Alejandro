from rest_framework import serializers
from lotes.models import Lote, Merma


class LoteRevisionSerializer(serializers.ModelSerializer):

    calidad_estado    = serializers.SerializerMethodField()
    bolsas_escaneadas = serializers.SerializerMethodField()
    total_mermas      = serializers.SerializerMethodField()
    integridad        = serializers.SerializerMethodField()

    class Meta:
        model  = Lote
        fields = [
            'id', 'codigo_lote', 'producto', 'cantidad',
            'estado', 'calidad_estado',
            'bolsas_escaneadas', 'total_mermas', 'integridad',
        ]

    def get_calidad_estado(self, obj):
        try:
            return obj.revision_calidad.estado
        except Exception:
            return 'pendiente'

    def get_bolsas_escaneadas(self, obj):
        return obj.bolsas.filter(escaneada=True).count()

    def get_total_mermas(self, obj):
        return obj.mermas.count()

    def get_integridad(self, obj):
        total = obj.bolsas.count()
        if not total:
            return 0.0
        escaneadas = obj.bolsas.filter(escaneada=True).count()
        return round((escaneadas / total) * 100, 1)


class MermaSerializer(serializers.ModelSerializer):

    lote           = serializers.SerializerMethodField()
    registrado_por = serializers.SerializerMethodField()

    class Meta:
        model  = Merma
        fields = ['id', 'codigo_barras', 'lote', 'sede', 'motivo', 'fecha', 'registrado_por']

    def get_lote(self, obj):
        return obj.lote.codigo_lote if obj.lote else '—'

    def get_registrado_por(self, obj):
        if not obj.registrado_por:
            return '—'
        nombre = obj.registrado_por.get_full_name()
        return nombre if nombre else obj.registrado_por.username