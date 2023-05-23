from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, FileResponse, HttpRequest
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET
from home.setup import *
from lizexp import settings
import json

@require_GET
@cache_control(max_age=60 * 60 * 24, immutable=True, public=True)  # one day
def favicon(request: HttpRequest) -> HttpResponse:
    file = (settings.BASE_DIR / 'static' / 'home' / 'img' / 'favicon.png').open('rb')
    return FileResponse(file)

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