from django.db import models as db_models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Lote, Bolsa, Merma
from .serializers import LoteSerializer
from .bartender import enviar_lote_bartender

from produccion.models import OrdenProduccion
import uuid


class LoteListView(generics.ListCreateAPIView):

    queryset = Lote.objects.all().order_by('-id')
    serializer_class = LoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):

        ultimo = Lote.objects.order_by('-orden_envio').first()
        orden_envio = (ultimo.orden_envio + 1) if ultimo else 1

        orden_id = self.request.data.get('orden')
        orden_obj = None
        malla = None

        if orden_id:
            try:
                orden_obj = OrdenProduccion.objects.select_related(
                    'malla'
                ).prefetch_related(
                    'malla__sedes'
                ).get(pk=orden_id)
                malla = orden_obj.malla
            except OrdenProduccion.DoesNotExist:
                pass

        lote = serializer.save(
            creado_por=self.request.user,
            orden_envio=orden_envio,
            orden=orden_id
        )

        if malla:
            sedes = malla.sedes.order_by('orden')
            contador = 1

            for sede in sedes:
                for i in range(sede.cuota_asignada):
                    Bolsa.objects.create(
                        lote=lote,
                        codigo_bolsa=f"BOL-{uuid.uuid4().hex[:8].upper()}",
                        codigo_barras=f"770{lote.id:04d}{contador:06d}",
                        serial=f"SER-{uuid.uuid4().hex[:10].upper()}",
                        sede=sede.nombre,
                        ciudad=sede.municipio,
                        ruta=sede.ruta,
                        peso=float(sede.peso_total_kg) / sede.cuota_asignada
                             if sede.cuota_asignada > 0 else 0.0,
                        destinatario=sede.institucion or sede.nombre,
                        direccion=sede.municipio,
                    )
                    contador += 1
        else:
            for i in range(lote.cantidad):
                Bolsa.objects.create(
                    lote=lote,
                    codigo_bolsa=f"BOL-{uuid.uuid4().hex[:8].upper()}",
                    codigo_barras=f"770{100000 + i}",
                    serial=f"SER-{uuid.uuid4().hex[:10].upper()}",
                    sede=f"Sede {i + 1}",
                    ciudad="Sin ciudad",
                    ruta=f"RUTA-{i + 1}",
                    peso=0.5,
                    destinatario=f"Destino {i + 1}",
                    direccion=f"Dirección {i + 1}",
                )


class LoteDetailView(generics.RetrieveUpdateDestroyAPIView):

    queryset = Lote.objects.all()
    serializer_class = LoteSerializer
    permission_classes = [permissions.IsAuthenticated]


# ── Bartender ────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def enviar_a_bartender(request, pk):

    try:
        lote = Lote.objects.get(pk=pk)
    except Lote.DoesNotExist:
        return Response(
            {'error': 'Lote no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )

    exito, mensaje = enviar_lote_bartender(lote)

    if exito:
        lote.estado = 'enviado'
        lote.fecha_envio_bt = timezone.now()
        lote.bartender_resp = mensaje
        lote.save()
        return Response({'ok': True, 'mensaje': mensaje})
    else:
        lote.estado = 'error_api'
        lote.bartender_resp = mensaje
        lote.save()
        return Response(
            {'ok': False, 'mensaje': mensaje},
            status=status.HTTP_502_BAD_GATEWAY
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def enviar_todos_bartender(request):

    lotes = Lote.objects.filter(
        estado__in=['generado', 'error_api']
    ).order_by('orden_envio')

    resultados = []

    for lote in lotes:
        exito, mensaje = enviar_lote_bartender(lote)
        lote.estado = 'enviado' if exito else 'error_api'
        lote.fecha_envio_bt = timezone.now() if exito else None
        lote.bartender_resp = mensaje
        lote.save()
        resultados.append({
            'lote': lote.codigo_lote,
            'exito': exito,
            'mensaje': mensaje,
        })

    return Response({'resultados': resultados})


# ── Escaneo ──────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def escanear_bolsa(request):
    codigo  = request.data.get('codigo_barras', '').strip()
    lote_id = request.data.get('lote_id')          # ← filtra por lote activo

    if not codigo:
        return Response(
            {'error': 'Código de barras requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        qs = Bolsa.objects.select_related('lote')
        if lote_id:
            qs = qs.filter(lote_id=lote_id)        # ← solo busca en el lote seleccionado
        bolsa = qs.get(codigo_barras=codigo)
    except Bolsa.DoesNotExist:
        return Response(
            {
                'error': 'Bolsa no encontrada en el lote activo',
                'codigo': codigo,
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if bolsa.escaneada:
        return Response(
            {
                'error': 'Bolsa ya escaneada',
                'codigo': codigo,
                'sede': bolsa.sede,
                'fecha_escaneo': bolsa.fecha_escaneo,
            },
            status=status.HTTP_409_CONFLICT
        )

    bolsa.escaneada     = True
    bolsa.fecha_escaneo = timezone.now()
    bolsa.escaneada_por = request.user
    bolsa.save()

    # Progreso por sede
    total_sede      = Bolsa.objects.filter(lote=bolsa.lote, sede=bolsa.sede).count()
    escaneadas_sede = Bolsa.objects.filter(lote=bolsa.lote, sede=bolsa.sede, escaneada=True).count()

    # Progreso global del lote
    total_lote      = Bolsa.objects.filter(lote=bolsa.lote).count()
    escaneadas_lote = Bolsa.objects.filter(lote=bolsa.lote, escaneada=True).count()

    return Response({
        'ok':              True,
        'codigo_bolsa':    bolsa.codigo_bolsa,
        'codigo_barras':   bolsa.codigo_barras,
        'sede':            bolsa.sede,
        'ciudad':          bolsa.ciudad,
        'ruta':            bolsa.ruta,
        'peso':            bolsa.peso,
        'lote':            bolsa.lote.codigo_lote,
        # Por sede
        'cuota_total':     total_sede,
        'cuota_escaneada': escaneadas_sede,
        'cuota_pendiente': total_sede - escaneadas_sede,
        # Por lote completo
        'lote_total':      total_lote,
        'lote_escaneado':  escaneadas_lote,
        'lote_pendiente':  total_lote - escaneadas_lote,
    })


# ── Merma ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def registrar_merma(request):
    codigo  = request.data.get('codigo_barras', '').strip()
    motivo  = request.data.get('motivo', 'Sin motivo').strip()
    lote_id = request.data.get('lote_id')

    if not codigo:
        return Response(
            {'error': 'Código de barras requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not lote_id:
        return Response(
            {'error': 'Lote requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        bolsa = (
            Bolsa.objects
            .select_related('lote')
            .filter(lote_id=lote_id)
            .get(codigo_barras=codigo)
        )
    except Bolsa.DoesNotExist:
        return Response(
            {'error': 'Bolsa no encontrada en el lote activo'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Revertir el escaneo para que la bolsa pueda volver a escanearse
    bolsa.escaneada     = False
    bolsa.fecha_escaneo = None
    bolsa.escaneada_por = None
    bolsa.save()

    # Guardar el registro de merma
    Merma.objects.create(
        bolsa          = bolsa,
        lote           = bolsa.lote,
        codigo_barras  = bolsa.codigo_barras,
        sede           = bolsa.sede,
        motivo         = motivo,
        registrado_por = request.user,
    )

    # Progreso actualizado tras revertir
    total_sede      = Bolsa.objects.filter(lote=bolsa.lote, sede=bolsa.sede).count()
    escaneadas_sede = Bolsa.objects.filter(lote=bolsa.lote, sede=bolsa.sede, escaneada=True).count()

    total_lote      = Bolsa.objects.filter(lote=bolsa.lote).count()
    escaneadas_lote = Bolsa.objects.filter(lote=bolsa.lote, escaneada=True).count()

    return Response({
        'ok':              True,
        'mensaje':         f'Merma registrada. La bolsa {codigo} puede volver a escanearse.',
        'codigo_barras':   bolsa.codigo_barras,
        'sede':            bolsa.sede,
        'lote':            bolsa.lote.codigo_lote,
        # Por sede
        'cuota_total':     total_sede,
        'cuota_escaneada': escaneadas_sede,
        'cuota_pendiente': total_sede - escaneadas_sede,
        # Por lote completo
        'lote_total':      total_lote,
        'lote_escaneado':  escaneadas_lote,
        'lote_pendiente':  total_lote - escaneadas_lote,
    })


# ── Progreso de lote ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def progreso_lote(request, pk):

    try:
        lote = Lote.objects.get(pk=pk)
    except Lote.DoesNotExist:
        return Response(
            {'error': 'Lote no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )

    total      = Bolsa.objects.filter(lote=lote).count()
    escaneadas = Bolsa.objects.filter(lote=lote, escaneada=True).count()

    # Desglose por sede
    sedes = (
        Bolsa.objects
        .filter(lote=lote)
        .values('sede')
        .annotate(
            total=db_models.Count('id'),
            escaneadas=db_models.Count(
                'id',
                filter=db_models.Q(escaneada=True)
            )
        )
        .order_by('sede')
    )

    # Mermas del lote
    mermas = (
        Merma.objects
        .filter(lote=lote)
        .values('sede', 'motivo', 'codigo_barras', 'fecha')
        .order_by('-fecha')
    )

    return Response({
        'lote':       lote.codigo_lote,
        'total':      total,
        'escaneadas': escaneadas,
        'pendientes': total - escaneadas,
        'sedes':      list(sedes),
        'mermas':     list(mermas),
    })
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def progreso_global(request):
    """RF-12 — Balance de masa por sede para el dashboard."""
    from django.db.models import Count, Q

    sedes = (
        Bolsa.objects
        .values('sede')
        .annotate(
            total=Count('id'),
            escaneadas=Count('id', filter=Q(escaneada=True))
        )
        .order_by('sede')
    )

    resultado = []
    for s in sedes:
        tot = s['total'] or 0
        esc = s['escaneadas'] or 0
        resultado.append({
            'sede':       s['sede'],
            'total':      tot,
            'escaneadas': esc,
            'porcentaje': round((esc / tot) * 100) if tot > 0 else 0,
        })

    return Response(resultado)


    from django.db.models import Q
from django.utils import timezone
from .models import Lote, Bolsa, Merma

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def actividad_reciente(request):
    """RF-10 — Feed de actividad reciente agregando eventos de lotes, escaneos y mermas."""
    limite = int(request.GET.get('limite', 30))
    eventos = []

    # Lotes creados recientemente
    for lote in Lote.objects.order_by('-fecha_creacion')[:limite]:
        eventos.append({
            'modulo':      'RF-03',
            'tipo':        'lote_creado',
            'icono':       '📦',
            'descripcion': f'Lote {lote.codigo_lote} creado — {lote.cantidad} bolsas',
            'fecha':       lote.fecha_creacion.isoformat(),
            'usuario':     lote.creado_por.get_full_name() if lote.creado_por else 'Sistema',
        })

    # Bolsas escaneadas recientemente
    for bolsa in (Bolsa.objects
                  .filter(escaneada=True, fecha_escaneo__isnull=False)
                  .select_related('escaneada_por', 'lote')
                  .order_by('-fecha_escaneo')[:limite]):
        eventos.append({
            'modulo':      'RF-05',
            'tipo':        'bolsa_escaneada',
            'icono':       '✅',
            'descripcion': f'Bolsa {bolsa.codigo_barras} escaneada — {bolsa.sede}',
            'fecha':       bolsa.fecha_escaneo.isoformat(),
            'usuario':     bolsa.escaneada_por.get_full_name() if bolsa.escaneada_por else 'Sistema',
        })

    # Mermas registradas
    for merma in (Merma.objects
                  .select_related('registrado_por')
                  .order_by('-fecha')[:limite]):
        eventos.append({
            'modulo':      'RF-09',
            'tipo':        'merma_registrada',
            'icono':       '⚠️',
            'descripcion': f'Merma {merma.codigo_barras} — {merma.motivo}',
            'fecha':       merma.fecha.isoformat(),
            'usuario':     merma.registrado_por.get_full_name() if merma.registrado_por else 'Sistema',
        })

    # Ordenar todos los eventos por fecha descendente y recortar
    eventos.sort(key=lambda e: e['fecha'], reverse=True)
    return Response(eventos[:limite])
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def inventario_operativo(request):
    from django.db.models import Count, Q, Sum

    # ── Paso 1: datos por lote individual ──────────────────────────────
    lotes_data = Lote.objects.annotate(
        total_bolsas=Count('bolsas', distinct=True),
        bolsas_escaneadas=Count('bolsas', filter=Q(bolsas__escaneada=True), distinct=True),
        total_mermas=Count('mermas', distinct=True),
    ).values('producto', 'id', 'total_bolsas', 'bolsas_escaneadas', 'total_mermas')

    # ── Paso 2: agrupar por producto en Python ──────────────────────────
    agrupado: dict = {}
    for lote in lotes_data:
        prod = lote['producto']
        if prod not in agrupado:
            agrupado[prod] = {
                'producto':      prod,
                'num_lotes':     0,
                'stock_teorico': 0,
                'stock_real':    0,
                'mermas':        0,
            }
        agrupado[prod]['num_lotes']     += 1
        agrupado[prod]['stock_teorico'] += lote['total_bolsas']
        agrupado[prod]['stock_real']    += lote['bolsas_escaneadas']
        agrupado[prod]['mermas']        += lote['total_mermas']

    # ── Paso 3: calcular diferencia y estado ───────────────────────────
    resultado = []
    for item in agrupado.values():
        diferencia = item['stock_real'] - item['stock_teorico']

        if diferencia == 0:
            estado = 'concilia'
        elif diferencia >= -3:
            estado = 'revisar'
        else:
            estado = 'diferencia'

        resultado.append({
            'producto':      item['producto'],
            'num_lotes':     item['num_lotes'],
            'stock_real':    item['stock_real'],
            'stock_teorico': item['stock_teorico'],
            'diferencia':    diferencia,
            'mermas':        item['mermas'],
            'estado':        estado,
        })

    # ── KPIs globales ──────────────────────────────────────────────────
    from .models import Merma as MermaModel

    stock_total    = sum(r['stock_teorico'] for r in resultado)
    stock_liberado = Bolsa.objects.filter(escaneada=True).count()
    en_revision    = max(0, stock_total - stock_liberado)
    total_mermas   = MermaModel.objects.count()

    return Response({
        'kpis': {
            'stock_total':    stock_total,
            'stock_liberado': stock_liberado,
            'en_revision':    en_revision,
            'mermas':         total_mermas,
        },
        'productos': resultado,
    })

from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
 
from .models import Lote
 
 
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def lista_para_liberacion(request):
    """
    RF-08 — Devuelve todos los lotes con su estado de calidad y stock.
    Lee RevisionCalidad (OneToOne) en lugar de Lote.calidad_estado.
    """
    lotes = (
        Lote.objects
        .select_related('revision_calidad', 'revision_calidad__revisado_por')
        .order_by('-fecha_creacion')
    )
 
    resultado = []
    for lote in lotes:
        # Leer desde RevisionCalidad si existe, si no → pendiente
        try:
            rev = lote.revision_calidad
            calidad_estado = rev.estado
            calidad_obs    = rev.observaciones or rev.motivo_rechazo
            calidad_por    = (
                rev.revisado_por.get_full_name()
                if rev.revisado_por else None
            )
            calidad_fecha  = rev.fecha_revision
        except Exception:
            calidad_estado = 'pendiente'
            calidad_obs    = None
            calidad_por    = None
            calidad_fecha  = None
 
        resultado.append({
            'id':              lote.id,
            'codigo_lote':     lote.codigo_lote,
            'producto':        lote.producto,
            'cantidad':        lote.cantidad,
            'estado':          lote.estado,
            'estado_display':  lote.get_estado_display(),
            'calidad_estado':  calidad_estado,
            'calidad_obs':     calidad_obs,
            'calidad_por':     calidad_por,
            'calidad_fecha':   calidad_fecha,
            'stock_bloqueado': calidad_estado != 'aprobado',
            'stock_liberado':  lote.estado == 'completado',
        })
 
    return Response(resultado)
 
 
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def liberar_stock(request, pk):
    """
    RF-08 — Libera el stock de un lote.
    Solo permitido si RevisionCalidad.estado == 'aprobado'.
    """
    try:
        lote = Lote.objects.select_related('revision_calidad').get(pk=pk)
    except Lote.DoesNotExist:
        return Response(
            {'error': 'Lote no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
 
    # Verificar aprobación desde RevisionCalidad
    try:
        calidad_estado = lote.revision_calidad.estado
    except Exception:
        calidad_estado = 'pendiente'
 
    if calidad_estado != 'aprobado':
        return Response(
            {
                'error': 'El lote no puede liberarse. Requiere aprobación de calidad.',
                'calidad_estado': calidad_estado,
            },
            status=status.HTTP_403_FORBIDDEN
        )
 
    if lote.estado == 'completado':
        return Response(
            {'error': 'Este lote ya fue liberado.'},
            status=status.HTTP_409_CONFLICT
        )
 
    lote.estado = 'completado'
    lote.save()
 
    return Response({
        'ok':          True,
        'mensaje':     f'Stock del lote {lote.codigo_lote} liberado exitosamente.',
        'codigo_lote': lote.codigo_lote,
        'estado':      lote.estado,
    })