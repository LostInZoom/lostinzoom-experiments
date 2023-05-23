from django.urls import path
from . import views

urlpatterns = [
    path('', views.initialization, name='index'),
    path('favicon', views.favicon),
    path('configuration/', views.configuration, name='configuration'),
    path('registration/', views.registration, name='registration'),
    path('send_results/', views.send_results, name='send_results')
]