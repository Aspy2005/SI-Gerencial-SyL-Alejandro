# lotes/actividad_views.py
"""
RF-10 / RF-12 — Feed de actividad reciente cross-módulo.
Agrega eventos de: Mallas, Producción, Lotes, Escaneos,
Mermas, Calidad, Liberación — ordenados por fecha descendente.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


def _fmt(dt):
    return dt.isoformat() if dt else None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def actividad_reciente(request):
    limite = int(request.query_params.get('limite', 30))
    eventos = []

    # ── RF-01 Mallas ──────────────────────────────────────────────────
    try:
        from mallas.models import MallaLogistica
        for m in MallaLogistica.objects.select_related('cargado_por').order_by('-fecha_carga')[:10]:
            usuario = m.cargado_por.get_full_name() if m.cargado_por else 'Sistema'
            eventos.append({
                'modulo':      'RF-01',
                'tipo':        'malla',
                'icono':       '📂',
                'descripcion': f'Malla logística cargada — {m.nombre_ruta} ({m.total_sedes} sedes, {m.total_unidades} uds)',
                'fecha':       _fmt(m.fecha_carga),
                'usuario':     usuario,
            })
    except Exception:
        pass

    # ── RF-03 Producción ──────────────────────────────────────────────
    try:
        from produccion.models import OrdenProduccion
        for op in OrdenProduccion.objects.select_related('creado_por').order_by('-fecha_creacion')[:10]:
            usuario = op.creado_por.get_full_name() if op.creado_por else 'Sistema'
            eventos.append({
                'modulo':      'RF-03',
                'tipo':        'produccion',
                'icono':       '⚙️',
                'descripcion': f'Orden {op.codigo_orden} — {op.producto} ({op.cantidad} uds) [{op.get_estado_display()}]',
                'fecha':       _fmt(op.fecha_creacion),
                'usuario':     usuario,
            })
    except Exception:
        pass

    # ── RF-04 Lotes creados ───────────────────────────────────────────
    try:
        from lotes.models import Lote
        for lote in Lote.objects.select_related('creado_por').order_by('-fecha_creacion')[:15]:
            usuario = lote.creado_por.get_full_name() if lote.creado_por else 'Sistema'
            eventos.append({
                'modulo':      'RF-04',
                'tipo':        'lote_creado',
                'icono':       '📦',
                'descripcion': f'Lote {lote.codigo_lote} creado — {lote.producto} ({lote.cantidad} uds)',
                'fecha':       _fmt(lote.fecha_creacion),
                'usuario':     usuario,
            })
            # BarTender
            if lote.fecha_envio_bt:
                eventos.append({
                    'modulo':      'RF-04',
                    'tipo':        'bartender',
                    'icono':       '🖨️',
                    'descripcion': f'Etiquetas enviadas a BarTender — {lote.codigo_lote}',
                    'fecha':       _fmt(lote.fecha_envio_bt),
                    'usuario':     'Sistema API',
                })
            # Error API
            if lote.estado == 'error_api':
                eventos.append({
                    'modulo':      'RF-04',
                    'tipo':        'error',
                    'icono':       '🔴',
                    'descripcion': f'Error BarTender — {lote.codigo_lote} no pudo imprimirse',
                    'fecha':       _fmt(lote.fecha_envio_bt or lote.fecha_creacion),
                    'usuario':     'Sistema',
                })
    except Exception:
        pass

    # ── RF-05 Escaneos ────────────────────────────────────────────────
    try:
        from lotes.models import Bolsa
        for b in (Bolsa.objects
                  .filter(escaneada=True)
                  .select_related('lote', 'escaneada_por')
                  .order_by('-fecha_escaneo')[:20]):
            usuario = b.escaneada_por.get_full_name() if b.escaneada_por else 'Operario'
            eventos.append({
                'modulo':      'RF-05',
                'tipo':        'escaneo',
                'icono':       '🔍',
                'descripcion': f'Bolsa escaneada — {b.codigo_barras} · Sede {b.sede} · Lote {b.lote.codigo_lote}',
                'fecha':       _fmt(b.fecha_escaneo),
                'usuario':     usuario,
            })
    except Exception:
        pass

    # ── RF-09 Mermas ──────────────────────────────────────────────────
    try:
        from lotes.models import Merma
        for m in (Merma.objects
                  .select_related('lote', 'registrado_por')
                  .order_by('-fecha')[:15]):
            usuario = m.registrado_por.get_full_name() if m.registrado_por else 'Operario'
            eventos.append({
                'modulo':      'RF-09',
                'tipo':        'merma',
                'icono':       '⚠️',
                'descripcion': f'Merma registrada — {m.codigo_barras} · Sede {m.sede} · {m.motivo}',
                'fecha':       _fmt(m.fecha),
                'usuario':     usuario,
            })
    except Exception:
        pass

    # ── RF-07 Calidad ─────────────────────────────────────────────────
    try:
        from calidad.models import RevisionCalidad
        for r in (RevisionCalidad.objects
                  .select_related('lote', 'revisado_por')
                  .exclude(fecha_revision=None)
                  .order_by('-fecha_revision')[:15]):
            usuario = r.revisado_por.get_full_name() if r.revisado_por else 'Analista'
            icono   = '✅' if r.estado == 'aprobado' else '❌'
            label   = 'aprobado' if r.estado == 'aprobado' else 'rechazado'
            obs     = f' — {r.motivo_rechazo}' if r.motivo_rechazo else ''
            eventos.append({
                'modulo':      'RF-07',
                'tipo':        f'calidad_{label}',
                'icono':       icono,
                'descripcion': f'Calidad {label} — {r.lote.codigo_lote}{obs}',
                'fecha':       _fmt(r.fecha_revision),
                'usuario':     usuario,
            })
    except Exception:
        pass

    # ── RF-08 Liberación ──────────────────────────────────────────────
    try:
        from lotes.models import Lote as LoteModel
        for lote in (LoteModel.objects
                     .filter(estado='completado')
                     .select_related('creado_por')
                     .order_by('-fecha_creacion')[:10]):
            usuario = lote.creado_por.get_full_name() if lote.creado_por else 'Jefe de Planta'
            eventos.append({
                'modulo':      'RF-08',
                'tipo':        'liberacion',
                'icono':       '🔓',
                'descripcion': f'Stock liberado — {lote.codigo_lote} · {lote.cantidad} uds disponibles',
                'fecha':       _fmt(lote.fecha_creacion),
                'usuario':     usuario,
            })
    except Exception:
        pass

    # ── Ordenar por fecha descendente y devolver ──────────────────────
    eventos.sort(
        key=lambda e: e['fecha'] or '1970-01-01',
        reverse=True
    )

    return Response(eventos[:limite])