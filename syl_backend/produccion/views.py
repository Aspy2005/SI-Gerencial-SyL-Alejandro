from rest_framework import generics, permissions
from .models import OrdenProduccion
from .serializers import OrdenProduccionSerializer

class OrdenListView(generics.ListCreateAPIView):
    queryset           = OrdenProduccion.objects.all()
    serializer_class   = OrdenProduccionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

class OrdenDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = OrdenProduccion.objects.all()
    serializer_class   = OrdenProduccionSerializer
    permission_classes = [permissions.IsAuthenticated]