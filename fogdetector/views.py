from django.shortcuts import render
from django.http import HttpResponse, FileResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET
from fogdetector.setup import *
from fogdetector.api.sessions import create_session, end_session, update_page_time, insert_trial, insert_form
from lizexp import settings
import json

# Create your views here.

@require_GET
@cache_control(max_age=60 * 60 * 24, immutable=True, public=True)  # one day
def favicon(request: HttpRequest) -> HttpResponse:
    file = (settings.BASE_DIR / 'static' / 'fogdetector' / 'img' / 'favicon.png').open('rb')
    return FileResponse(file)

@csrf_exempt
def initialization(request):
    return render(request, 'fogdetector/index.html', {
            'name': 'fogdetector',
            'fullname': 'Fog Detector',
            'version': 1.0,
        })

@csrf_exempt
def configuration(request):
    mimetype = 'application/json'
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_ajax:
        return HttpResponse(json.dumps(APP_CONFIGURATION), mimetype)

@csrf_exempt
def registration(request):
    mimetype = 'text/plain'
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_ajax:
        if request.method == 'POST':
            data = json.loads(request.POST.getlist('data')[0])
            key = create_session(data)
            return HttpResponse(key, mimetype)

@csrf_exempt
def download_information(request):
    mimetype = 'application/pdf'
    pdf = 'fogdetector/static/fogdetector/download/information_sheet_fogdetector.pdf'
    print(pdf)
    response = HttpResponse(open(pdf, 'rb'), mimetype)
    response['Content-Disposition'] = "attachment; filename=%s" % 'information-fogdetector.pdf'
    return response

@csrf_exempt
def update_time(request):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_ajax:
        if request.method == 'POST':
            data = json.loads(request.POST.getlist('data')[0])
            update_page_time(data['user'], data['page'], data['time'])
            return HttpResponse()

@csrf_exempt
def form_results(request):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_ajax:
        if request.method == 'POST':
            data = json.loads(request.POST.getlist('data')[0])
            if 'user' in data:
                insert_form(data)
            return HttpResponse()

@csrf_exempt
def trial_results(request):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_ajax:
        if request.method == 'POST':
            data = json.loads(request.POST.getlist('data')[0])
            if 'user' in data:
                insert_trial(data)
            return HttpResponse()

@csrf_exempt
def end_results(request):
    mimetype = 'application/json'
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_ajax:
        if request.method == 'POST':
            data = json.loads(request.POST.getlist('data')[0])
            if 'user' in data:
                results = end_session(data)
            else:
                results = ''
            return HttpResponse(json.dumps(results), mimetype)