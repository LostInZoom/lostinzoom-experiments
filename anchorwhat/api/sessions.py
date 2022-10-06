from django.contrib.sessions.backends.db import SessionStore
from django.contrib.gis.geos import LineString, Point
from django.core.serializers import serialize
from anchorwhat.models import Drawing, Questions, Survey, Sessions, PageTime, Pages, Trials, Sets
from datetime import datetime, timezone
from device_detector import DeviceDetector
from user_agents import parse
from random import choice
import json

def create_session(data):
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

    return key

def update_page_time(user, page, time):
    s = Sessions.objects.get(django_key=user)
    p = Pages.objects.get(pk=page)
    if PageTime.objects.filter(session=s.id, page_number=p.id).exists():
        pt = PageTime.objects.get(session=s.id, page_number=p.id)
        pt.duration_ms = pt.duration_ms + time
        pt.save()
    else:
        e = PageTime(
            session = s,
            page_number = p,
            duration_ms = time
        )
        e.save()

def insert_form(data):
    user = data['user']
    s = Sessions.objects.get(django_key=user)
    page = data['data']['page']
    questions = data['data']['questions']
    for question in questions:
        an = questions[question]['answer']
        if isinstance(an, list):
            a = ', '.join(an)
        else:
            a = an
        q = Questions.objects.get(page_number=page, number=question)
        if Survey.objects.filter(session=s, question=q).exists():
            new = Survey.objects.get(session=s, question=q)
            new.answer = a
        else:
            new = Survey(
                session = s,
                question = q,
                answer = a
            )
        new.save()

def insert_trial(data):
    session = Sessions.objects.get(django_key=data['user'])
    s = Sets.objects.get(id=data['setid'])
    trial = Trials(
        session = session,
        zoom = data['zoom'],
        start = data['start'],
        end = data['end'],
        duration_ms = data['duration'],
        set_id = s,
        layer1 = data['layers'][0],
        layer2 = data['layers'][1],
        layer3 = data['layers'][2],
        layer4 = data['layers'][3],
        layer5 = data['layers'][4]
    )
    trial.save()

    layers = data['objects']
    index = 1
    for l in layers:
        layer = index
        for o in l:
            nodes = []
            for p in o['geometry']:
                nodes.append(Point(p[0], p[1]))
            linestring = LineString(nodes, srid = 3857)
            line = Drawing(
                trial = trial,
                layer = layer,
                importance = o['importance'],
                thickness = o['thickness'],
                buffer = o['buffer'],
                geom_line = linestring,
                geom_poly = linestring.buffer(o['buffer'])
            )
            line.save()
        index += 1

def get_results(data, end):
    i = data['index']
    s = Sessions.objects.get(django_key=data['user'])
    if end:
        s.end = datetime.now(timezone.utc)
        s.save()

    usertrials = Trials.objects.filter(session=s)
    if i >= len(usertrials):
        i = 0
    usertrial = usertrials[i]
    userdrawing = Drawing.objects.filter(trial=usertrial)
    
    if usertrial.set_id.basemap == 'google':
        basemaptype = 'google'
        srid = 4326
    else:
        basemaptype = 'ol'
        srid = 3857

    user = serialize('geojson', userdrawing, geometry_field='geom_poly', fields=('layer', 'importance'), srid=srid)

    othertrials = Trials.objects.filter(zoom=usertrial.zoom, set_id=usertrial.set_id).exclude(session=s)
    if othertrials:
        othertrial = choice(othertrials)
        otherdrawing = Drawing.objects.filter(trial=othertrial)
        other = json.loads(serialize('geojson', otherdrawing, geometry_field='geom_poly', fields=('layer', 'importance'), srid=srid))
    else:
        other = False

    return {
        'index': i,
        'type': basemaptype,
        'basemap': usertrial.set_id.basemap,
        'center': [usertrial.set_id.x, usertrial.set_id.y],
        'zoom': usertrial.zoom,
        'user': json.loads(user),
        'other': other
    }