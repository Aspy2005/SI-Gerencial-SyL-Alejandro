from django.urls import path

from .views import (
    MallaListView,
    MallaUploadView,
    MallaDetailView,
    MallaPreviewView
)

urlpatterns = [

    path(
        '',
        MallaListView.as_view(),
        name='malla-list'
    ),

    path(
        'upload/',
        MallaUploadView.as_view(),
        name='malla-upload'
    ),

    path(
        'preview/',
        MallaPreviewView.as_view(),
        name='malla-preview'
    ),

    path(
        '<int:pk>/',
        MallaDetailView.as_view(),
        name='malla-detail'
    ),
]