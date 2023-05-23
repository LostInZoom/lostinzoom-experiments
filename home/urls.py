from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('favicon', views.favicon),
    path('configuration/', views.configuration, name='configuration'),
]