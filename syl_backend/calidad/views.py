from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from lotes.models import Lote, Merma
from .models import RevisionCalidad
from .serializers import LoteRevisionSerializer, MermaSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lotes_en_revision(request):
    lotes = Lote.objects.prefetch_related(
        'bolsas', 'mermas'
    ).select_related('revision_calidad').all()

    serializer = LoteRevisionSerializer(lotes, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def aprobar_lote(request, pk):
    try:
        lote = Lote.objects.get(pk=pk)
    except Lote.DoesNotExist:
        return Response({'error': 'Lote no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    revision, _ = RevisionCalidad.objects.get_or_create(lote=lote)
    revision.estado         = 'aprobado'
    revision.observaciones  = request.data.get('observaciones', '')
    revision.revisado_por   = request.user
    revision.fecha_revision = timezone.now()
    revision.save()

    return Response({'ok': True, 'lote': lote.codigo_lote, 'estado': 'aprobado'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rechazar_lote(request, pk):
    try:
        lote = Lote.objects.get(pk=pk)
    except Lote.DoesNotExist:
        return Response({'error': 'Lote no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    motivo = request.data.get('motivo', '').strip()
    if not motivo:
        return Response(
            {'error': 'El motivo de rechazo es obligatorio'},
            status=status.HTTP_400_BAD_REQUEST
        )

    revision, _ = RevisionCalidad.objects.get_or_create(lote=lote)
    revision.estado          = 'rechazado'
    revision.motivo_rechazo  = motivo
    revision.revisado_por    = request.user
    revision.fecha_revision  = timezone.now()
    revision.save()

    return Response({'ok': True, 'lote': lote.codigo_lote, 'estado': 'rechazado'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mermas_turno(request):
    mermas = Merma.objects.select_related(
        'lote', 'registrado_por'
    ).order_by('-fecha')

    lote_id = request.query_params.get('lote')
    if lote_id:
        mermas = mermas.filter(lote_id=lote_id)

    serializer = MermaSerializer(mermas, many=True)
    return Response(serializer.data)