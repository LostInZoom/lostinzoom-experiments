from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.geos import Polygon, MultiPolygon, LineString, Point
from deepmapdraw.setup import *
from datetime import datetime, timezone
from device_detector import DeviceDetector
from django.contrib.sessions.backends.db import SessionStore
from user_agents import parse
from deepmapdraw.models import Sessions, Sets, Drawings
import json

# Create your views here.

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
            session.screen_width = data["resolution"][0]
            session.screen_height = data["resolution"][1]
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
            zoom = data['zoom']
            extent = data['extent']
            center = data['center']

            session = Sessions.objects.get(django_key=data['user'])
            set = Sets()
            set.session = session
            set.basemap = basemap
            set.zoom = zoom
            set.basemap = basemap
            set.center_x = center[0]
            set.center_y = center[1]
            set.x_min = extent[0][0]
            set.x_max = extent[1][0]
            set.y_min = extent[0][1]
            set.y_max = extent[1][1]
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

                    drawing = Drawings()
                    drawing.set = set
                    drawing.layer = index + 1
                    drawing.number = layerinfo[indexempty]['number']
                    drawing.name = layerinfo[indexempty]['name']
                    drawing.color = layerinfo[indexempty]['colors']['drawing']
                    drawing.geom = intersection
                    drawing.save()

                    index += 1
                    indexempty += 1
                else:
                    indexempty += 1
            return HttpResponse(json.dumps(features))