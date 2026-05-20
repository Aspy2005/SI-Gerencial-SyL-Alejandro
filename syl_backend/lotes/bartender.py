from django.conf import settings


def enviar_lote_bartender(lote):
    """
    Simulación de envío a BarTender.
    """

    mensaje = (
        f"Lote {lote.codigo_lote} enviado correctamente "
        f"a BarTender. "
        f"Producto: {lote.producto} | "
        f"Cantidad: {lote.cantidad} | "
        f"Orden envío: {lote.orden_envio}"
    )

    return True, mensaje