import os

from rest_framework import generics
from rest_framework import permissions
from rest_framework import status

from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MallaLogistica, Sede

from .serializers import (
    MallaSerializer,
    MallaUploadSerializer,
)

from .procesador import (
    procesar_excel,
    procesar_pdf
)


class MallaListView(generics.ListAPIView):

    queryset = MallaLogistica.objects.all()
    serializer_class = MallaSerializer
    permission_classes = [permissions.IsAuthenticated]


class MallaDetailView(generics.RetrieveAPIView):

    queryset = MallaLogistica.objects.all()
    serializer_class = MallaSerializer
    permission_classes = [permissions.IsAuthenticated]


class MallaUploadView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):

        serializer = MallaUploadSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        archivo = request.FILES.get('archivo')

        if not archivo:
            return Response(
                {'error': 'Debe enviar un archivo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        extension = os.path.splitext(
            archivo.name
        )[1].lower()

        if extension not in ['.xlsx', '.xls', '.pdf']:

            return Response(
                {'error': 'Formato no permitido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        malla = serializer.save(
            cargado_por=request.user,
            estado='procesando'
        )

        try:

            ruta = malla.archivo.path

            if extension in ['.xlsx', '.xls']:
                sedes_data = procesar_excel(ruta)

            elif extension == '.pdf':
                sedes_data = procesar_pdf(ruta)

            else:
                sedes_data = []

            for sede_data in sedes_data:

                Sede.objects.create(
                    malla=malla,
                    **sede_data
                )

            malla.total_sedes = len(sedes_data)

            malla.total_unidades = sum(
                s['cuota_asignada']
                for s in sedes_data
            )

            malla.estado = 'activa'

            malla.save()

            return Response(
                MallaSerializer(malla).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:

            malla.estado = 'archivada'
            malla.save()

            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MallaPreviewView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):

        archivo = request.FILES.get('archivo')

        if not archivo:

            return Response(
                {'error': 'Archivo requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        extension = os.path.splitext(
            archivo.name
        )[1].lower()

        ruta_temp = f'temp_{archivo.name}'

        with open(ruta_temp, 'wb+') as dest:

            for chunk in archivo.chunks():

                dest.write(chunk)

        try:

            if extension in ['.xlsx', '.xls']:

                sedes_data = procesar_excel(ruta_temp)

            else:

                sedes_data = procesar_pdf(ruta_temp)

            total_sedes = len(sedes_data)

            total_unidades = sum(
                s['cuota_asignada']
                for s in sedes_data
            )

            return Response({

                'sedes': sedes_data,
                'total_sedes': total_sedes,
                'total_unidades': total_unidades

            })

        except Exception as e:

            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        finally:

            if os.path.exists(ruta_temp):

                os.remove(ruta_temp)