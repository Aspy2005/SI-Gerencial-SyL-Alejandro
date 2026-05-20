from rest_framework import serializers

from .models import Lote
from .models import Bolsa


class BolsaSerializer(serializers.ModelSerializer):

    class Meta:

        model = Bolsa

        fields = '__all__'


class LoteSerializer(serializers.ModelSerializer):

    bolsas = BolsaSerializer(
        many=True,
        read_only=True
    )

    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:

        model = Lote

        fields = '__all__'