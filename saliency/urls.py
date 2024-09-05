from django.views.generic import RedirectView
from django.urls import path
from . import views

urlpatterns = [
    path('<str:path>', views.page, name='page'),
]