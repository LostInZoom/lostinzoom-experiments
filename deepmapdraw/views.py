from django.shortcuts import render
from django.http import HttpResponse, FileResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.core.files.base import ContentFile
from django.contrib.gis.geos import Polygon, MultiPolygon, LineString, Point
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET
from deepmapdraw.setup import *
from django.contrib.gis import geos
from datetime import datetime, timezone
from device_detector import DeviceDetector
from django.contrib.sessions.backends.db import SessionStore
from user_agents import parse
from deepmapdraw.models import Sessions, Sets, Layers
from mapdraw.setup import *
from lizexp import settings
import json
import base64

# Create your views here.

@require_GET
@cache_control(max_age=60 * 60 * 24, immutable=True, public=True)  # one day
def favicon(request: HttpRequest) -> HttpResponse:
    file = (settings.BASE_DIR / 'static' / 'deepmapdraw' / 'img' / 'favicon.png').open('rb')
    return FileResponse(file)

def initialization(request):
    return render(request, 'deepmapdraw/index.html', {
            'name': 'deepmapdraw',
            'fullname': 'Deep Map Draw',
            'version': 1.0,
        })

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
            s = SessionStore()
            s.create()
            key = s.session_key
            ua = data["userAgent"]
            device = DeviceDetector(ua).parse()
            browser = parse(ua)
            start = datetime.now(timezone.utc)
            session = Sessions()
            session.django_key = key
            session.device = device.device_type()
            session.os = device.os_name()
            session.browser = browser.browser.family
            session.user_agent = ua
            session.start = start
            session.save()

            return HttpResponse(key, mimetype)

@csrf_exempt
def send_results(request):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_ajax:
        if request.method == 'POST':
            data = json.loads(request.POST.getlist('data')[0])
            layers = data['objects']
            layerinfo = data['layers']
            basemap = data['basemap']
            baseimage = data['imagebasemap']
            zoom = data['zoom']
            extent = data['extent']
            center = data['center']

            session = Sessions.objects.get(django_key=data['user'])

            set = Sets()
            set.session = session
            set.start = data['start']
            set.end = data['end']
            set.basemap = basemap
            set.basemapimage = baseimage
            set.zoom = zoom
            set.basemap = basemap
            set.center_x = center[0]
            set.center_y = center[1]
            set.x_min = extent[0][0]
            set.x_max = extent[1][0]
            set.y_min = extent[1][1]
            set.y_max = extent[0][1]
            set.screen_width = data["resolution"][0]
            set.screen_height = data["resolution"][1]
            set.save()

            extentpolygon = Polygon((
                (extent[0][0], extent[0][1]),
                (extent[1][0], extent[0][1]),
                (extent[1][0], extent[1][1]),
                (extent[0][0], extent[1][1]),
                (extent[0][0], extent[0][1])
            ))

            index = 0
            indexempty = 0
            features = {
                "type": "FeatureCollection",
                "name": "Deepmapdraw export",
                "crs": {
                    "type": "name",
                    "properties": {
                        "name": "urn:ogc:def:crs:EPSG::3857"
                    }
                },
                "features": []
            }
            for l in layers:
                if len(l) > 0:
                    feature = {
                        "type": "Feature",
                        "properties": {
                            "layer": index + 1,
                            "number": layerinfo[indexempty]['number'],
                            "name": layerinfo[indexempty]['name'],
                            "color": layerinfo[indexempty]['colors']['drawing'],
                            "basemap": basemap,
                            "zoom": zoom,
                            "extent": extent,
                            "first time draw": l[0]['timestamp'],
                            "last time draw": l[len(l) - 1]['timestamp']
                        }
                    }
                    polygons = []
                    for o in l:
                        nodes = []
                        for p in o['geometry']:
                            nodes.append(Point(p[0], p[1]))
                        linestring = LineString(nodes, srid = 3857)
                        polygon = linestring.buffer(o['buffer'])
                        polygons.append(polygon)

                    multipolygon = MultiPolygon([polygons[0]], srid = 3857)
                    jindex = 1
                    while jindex < len(polygons):
                        multipolygon = multipolygon.union(polygons[jindex])
                        jindex += 1
                    intersection = multipolygon.intersection(extentpolygon)
                    feature["geometry"] = json.loads(intersection.geojson)
                    features["features"].append(feature)

                    if intersection and isinstance(intersection, geos.Polygon):
                        intersection = geos.MultiPolygon(intersection)

                    layer = Layers()
                    layer.set = set
                    layer.start = l[0]['date']
                    layer.end = l[len(l) - 1]['date']
                    layer.layer = index + 1
                    layer.number = layerinfo[indexempty]['number']
                    layer.name = layerinfo[indexempty]['name']
                    layer.color = layerinfo[indexempty]['colors']['drawing']
                    layer.geom = intersection
                    layer.save()

                    index += 1
                    indexempty += 1
                else:
                    indexempty += 1
            return HttpResponse(json.dumps(features))