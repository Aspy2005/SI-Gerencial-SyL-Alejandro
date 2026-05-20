"""
RF-10 — Trazabilidad de Producción
Agrega en un solo endpoint el historial completo de un lote:
creación → BarTender → escaneos → mermas → calidad → liberación.
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from lotes.models import Lote, Bolsa, Merma


def _build_historial(lote: Lote, bolsa: Bolsa | None = None) -> dict:
    """Construye el historial de eventos de un lote en orden cronológico."""
    eventos = []

    # 1. Creación del lote
    creado_por = lote.creado_por.get_full_name() if lote.creado_por else 'Sistema'
    eventos.append({
        'tipo':        'creacion',
        'descripcion': f'Lote creado — {lote.producto}, {lote.cantidad} uds',
        'fecha':       lote.fecha_creacion,
        'usuario':     creado_por,
    })

    # 2. Envío a BarTender
    if lote.fecha_envio_bt:
        eventos.append({
            'tipo':        'bartender',
            'descripcion': f'Etiquetas enviadas a BarTender — {lote.codigo_lote}',
            'fecha':       lote.fecha_envio_bt,
            'usuario':     'Sistema API',
        })

    # 3. Mermas del lote (en orden cronológico)
    mermas_qs = Merma.objects.filter(lote=lote).select_related('registrado_por').order_by('fecha')
    for m in mermas_qs:
        reg = m.registrado_por.get_full_name() if m.registrado_por else 'Operario'
        eventos.append({
            'tipo':        'merma',
            'descripcion': f'Merma registrada — {m.codigo_barras} — Sede {m.sede} — {m.motivo}',
            'fecha':       m.fecha,
            'usuario':     reg,
        })

    # 4. Revisión de calidad
    try:
        rev = lote.revision_calidad
        if rev.fecha_revision:
            rev_por = rev.revisado_por.get_full_name() if rev.revisado_por else 'Analista'
            label   = 'aprobado' if rev.estado == 'aprobado' else 'rechazado'
            desc    = f'Calidad {label}'
            if rev.observaciones:
                desc += f' — {rev.observaciones}'
            if rev.motivo_rechazo:
                desc += f' — Motivo: {rev.motivo_rechazo}'
            eventos.append({
                'tipo':        'calidad',
                'descripcion': desc,
                'fecha':       rev.fecha_revision,
                'usuario':     rev_por,
            })
    except Exception:
        pass

    # 5. Liberación (estado completado)
    if lote.estado == 'completado':
        # Tomamos la última modificación del lote como fecha de liberación
        # (puedes agregar un campo fecha_liberacion al modelo para mayor precisión)
        eventos.append({
            'tipo':        'liberacion',
            'descripcion': f'Stock liberado — {lote.cantidad} unidades disponibles para despacho',
            'fecha':       lote.fecha_creacion,   # reemplazar por fecha_liberacion si la agregas
            'usuario':     'Jefe de Planta',
        })

    # Ordenar por fecha ascendente
    eventos.sort(key=lambda e: e['fecha'] or timezone.now())

    # Serializar fechas a ISO string
    for ev in eventos:
        if ev['fecha']:
            ev['fecha'] = ev['fecha'].isoformat()

    # Detalle de bolsa si se buscó por código de barras
    bolsa_data = None
    if bolsa:
        esc_por = bolsa.escaneada_por.get_full_name() if bolsa.escaneada_por else None
        bolsa_data = {
            'codigo_bolsa':  bolsa.codigo_bolsa,
            'codigo_barras': bolsa.codigo_barras,
            'sede':          bolsa.sede,
            'ciudad':        bolsa.ciudad,
            'escaneada':     bolsa.escaneada,
            'fecha_escaneo': bolsa.fecha_escaneo.isoformat() if bolsa.fecha_escaneo else None,
            'escaneada_por': esc_por,
        }

    try:
        cal_estado = lote.revision_calidad.estado
    except Exception:
        cal_estado = 'pendiente'

    return {
        'codigo_lote':    lote.codigo_lote,
        'producto':       lote.producto,
        'cantidad':       lote.cantidad,
        'estado':         lote.estado,
        'calidad_estado': cal_estado,
        'eventos':        eventos,
        'bolsa':          bolsa_data,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trazabilidad_buscar(request):
    """
    GET /api/lotes/trazabilidad/?q=<query>
    Acepta:
      - codigo_lote  (LOT-XXXXXXXX)
      - codigo_barras de una bolsa
      - nombre de sede (devuelve el lote con más bolsas de esa sede)
    """
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response(
            {'error': 'El parámetro "q" es requerido.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    lote  = None
    bolsa = None

    # 1. Buscar por código de lote exacto
    try:
        lote = Lote.objects.select_related(
            'creado_por', 'revision_calidad', 'revision_calidad__revisado_por'
        ).get(codigo_lote__iexact=q)
    except Lote.DoesNotExist:
        pass

    # 2. Buscar por código de barras de bolsa
    if not lote:
        try:
            bolsa = Bolsa.objects.select_related(
                'lote', 'lote__creado_por',
                'lote__revision_calidad',
                'lote__revision_calidad__revisado_por',
                'escaneada_por'
            ).get(codigo_barras=q)
            lote = bolsa.lote
        except Bolsa.DoesNotExist:
            pass

    # 3. Buscar por sede (primer lote que tenga bolsas de esa sede)
    if not lote:
        bolsa_sede = (
            Bolsa.objects
            .select_related(
                'lote', 'lote__creado_por',
                'lote__revision_calidad',
                'lote__revision_calidad__revisado_por',
            )
            .filter(sede__icontains=q)
            .first()
        )
        if bolsa_sede:
            lote = bolsa_sede.lote

    if not lote:
        return Response(
            {'error': f'No se encontró ningún lote, bolsa ni sede con: "{q}"'},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response(_build_historial(lote, bolsa))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trazabilidad_lote(request, pk):
    """
    GET /api/lotes/<pk>/trazabilidad/
    Historial directo por ID de lote.
    """
    try:
        lote = Lote.objects.select_related(
            'creado_por', 'revision_calidad', 'revision_calidad__revisado_por'
        ).get(pk=pk)
    except Lote.DoesNotExist:
        return Response(
            {'error': 'Lote no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response(_build_historial(lote))