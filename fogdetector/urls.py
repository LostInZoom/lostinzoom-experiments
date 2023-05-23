from django.views.generic import RedirectView
from django.urls import path
from . import views

urlpatterns = [
    path('', views.initialization, name='index'),
    path('favicon', views.favicon),
    path('registration/', views.registration, name='registration'),
    path('download-information/', views.download_information, name='downloadinformation'),
    path('configuration/', views.configuration, name='configuration'),
    path('update-time/', views.update_time, name='updatetime'),
    path('form-results/', views.form_results, name='formresults'),
    path('trial-results/', views.trial_results, name='trialresults'),
    path('end-results/', views.end_results, name='end_results'),
]