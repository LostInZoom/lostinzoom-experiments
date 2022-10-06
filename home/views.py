from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from home.setup import *
import json

# Create your views here.
@csrf_exempt
def index(request):
    return render(request, 'home/index.html', {
            'name': 'home',
            'fullname': 'LostInZoom experiments',
            'version': 1.0,
        })

def configuration(request):
    mimetype = 'application/json'
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_ajax:
        return HttpResponse(json.dumps(APP_CONFIGURATION), mimetype)