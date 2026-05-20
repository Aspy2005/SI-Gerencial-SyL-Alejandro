from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, UsuarioListView, UsuarioDetailView, RegistroView

urlpatterns = [
    path('login/',    LoginView.as_view(),        name='login'),
    path('refresh/',  TokenRefreshView.as_view(),  name='token_refresh'),
    path('registro/', RegistroView.as_view(),      name='registro'),
    path('usuarios/', UsuarioListView.as_view(),   name='usuarios'),
    path('usuarios/<int:pk>/', UsuarioDetailView.as_view(), name='usuario_detail'),
]