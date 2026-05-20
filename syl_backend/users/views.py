from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario
from .serializers import UsuarioSerializer, RegistroSerializer

class CustomTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UsuarioSerializer(self.user).data
        return data

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer

class UsuarioListView(generics.ListCreateAPIView):
    queryset           = Usuario.objects.all()
    serializer_class   = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

class UsuarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Usuario.objects.all()
    serializer_class   = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

class RegistroView(generics.CreateAPIView):
    serializer_class   = RegistroSerializer
    permission_classes = [permissions.AllowAny]