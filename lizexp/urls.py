"""lizexp URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('', include('home.urls'), name='home'),
    path('fogdetector/', include('fogdetector.urls'), name='fogdetector'),
    path('anchorwhat/', include('anchorwhat.urls'), name='anchorwhat'),
    path('mapdraw/', include('mapdraw.urls'), name='mapdraw'),
    path('deepmapdraw/', include('deepmapdraw.urls'), name='deepmapdraw'),
    path('zoomtracker/', include('zoomtracker.urls'), name='zoomtracker'),
    path('saliency/', include('saliency.urls'), name='saliency'),
    path('seism/', include('seism.urls'), name='seism'),
    path('seism2/', include('seism2.urls'), name='seism2'),
    path('thegoodmap/', include('thegoodmap.urls'), name='thegoodmap'),
]
