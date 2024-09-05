from django.shortcuts import render
from django.http import HttpResponse, FileResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET
from lizexp import settings
import json

# Create your views here.

def page(request, path): 
    return render(request, 'saliency/{0}'.format(path), {
            'name': 'saliency',
            'fullname': 'saliency',
            'version': 1.0,
        })
