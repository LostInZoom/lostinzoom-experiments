from django.urls import path
from . import views

urlpatterns = [
    path('', views.initialization, name='index'),
    path('configuration/', views.configuration, name='configuration'),
    path('download/', views.download, name='download')
]