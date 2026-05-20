from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',       include('users.urls')),
    path('api/mallas/',     include('mallas.urls')),
    path('api/produccion/', include('produccion.urls')),
    path('api/lotes/',      include('lotes.urls')),
    path('api/calidad/',    include('calidad.urls')),  # ← esta línea
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)