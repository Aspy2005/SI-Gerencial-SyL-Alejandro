from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol', 'activo']

class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model  = Usuario
        fields = ['username', 'email', 'first_name', 'last_name', 'rol', 'password']

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)

# ─── NUEVO ────────────────────────────────────────────────────────────────────
class CustomTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)          # genera access + refresh
        
        # Adjunta los datos del usuario en la respuesta
        data['user'] = {
            'id':         self.user.id,
            'username':   self.user.username,
            'first_name': self.user.first_name,
            'last_name':  self.user.last_name,
            'email':      self.user.email,
            'rol':        self.user.rol,
            'activo':     self.user.activo,
        }
        return data