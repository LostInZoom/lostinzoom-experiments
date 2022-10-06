from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.geos import Polygon, MultiPolygon, LineString, Point
from mapdraw.setup import *
import json

# Create your views here.

def initialization(request):
    return render(request, 'mapdraw/index.html', {
            'name': 'mapdraw',
            'fullname': 'Map Draw',
            'version': 1.0,
        })

def configuration(request):
    mimetype = 'application/json'
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_ajax:
        return HttpResponse(json.dumps(APP_CONFIGURATION), mimetype)

@csrf_exempt
def download(request):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_ajax:
        if request.method == 'POST':
            data = json.loads(request.POST.getlist('data')[0])
            layers = data['objects']
            layerinfo = data['layers']
            basemap = data['basemap']
            zoom = data['zoom']
            extent = data['extent']

            extentpolygon = Polygon((
                (extent[0][0], extent[0][1]),
                (extent[1][0], extent[0][1]),
                (extent[1][0], extent[1][1]),
                (extent[0][0], extent[1][1]),
                (extent[0][0], extent[0][1])
            ))

            index = 0
            features = {
                "type": "FeatureCollection",
                "name": "Mapdraw export",
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
                            "name": layerinfo[index]['name'],
                            "color": layerinfo[index]['color'],
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
                    index += 1
                    intersection = multipolygon.intersection(extentpolygon)
                    feature["geometry"] = json.loads(intersection.geojson)
                    features["features"].append(feature)
            return HttpResponse(json.dumps(features))