from django.shortcuts import render
from django.http import HttpResponse, FileResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET
from lizexp import settings
import json

# Create your views here.
def initialization(request):
    return render(request, 'seism/index.html', {
            'name': 'seism',
            'fullname': 'Nice seism map',
            'version': 1.0,
        })
