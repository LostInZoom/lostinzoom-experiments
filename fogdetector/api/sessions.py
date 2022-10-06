from django.contrib.sessions.backends.db import SessionStore
from django.db.models import Avg, Max, Min
from fogdetector.models import Questions, Survey, Sessions, PageTime, Pages, Trials, TrialsOptions, Sets, Targets
from datetime import datetime, timezone
from device_detector import DeviceDetector
from user_agents import parse

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
    session.save(using='fogdetector')

    return key

def update_page_time(user, page, time):
    s = Sessions.objects.using('fogdetector').get(django_key=user)
    p = Pages.objects.using('fogdetector').get(pk=page)
    if PageTime.objects.filter(session=s.id, page_number=p.id).exists():
        pt = PageTime.objects.using('fogdetector').get(session=s.id, page_number=p.id)
        pt.duration_ms = pt.duration_ms + time
        pt.save(using='fogdetector')
    else:
        e = PageTime(
            session = s,
            page_number = p,
            duration_ms = time
        )
        e.save(using='fogdetector')

def insert_form(data):
    user = data['user']
    s = Sessions.objects.using('fogdetector').get(django_key=user)
    page = data['data']['page']
    questions = data['data']['questions']
    for question in questions:
        an = questions[question]['answer']
        if isinstance(an, list):
            a = ', '.join(an)
        else:
            a = an
        q = Questions.objects.using('fogdetector').get(page_number=page, number=question)
        if Survey.objects.using('fogdetector').filter(session=s, question=q).exists():
            new = Survey.objects.using('fogdetector').get(session=s, question=q)
            new.answer = a
        else:
            new = Survey(
                session = s,
                question = q,
                answer = a
            )
        new.save(using='fogdetector')

def insert_trial(data):
    s = Sessions.objects.using('fogdetector').get(django_key=data['user'])
    tr = TrialsOptions.objects.using('fogdetector').get(id=data['trialId'])
    ta = Targets.objects.using('fogdetector').get(id=data['targetId'])
    trial = Trials(
        session = s,
        trial_options = tr,
        trial_position = data['position'],
        start = data['start'],
        end = data['end'],
        duration_ms = data['duration'],
        target = ta,
        target_start_top = data['target-position-start']['top'],
        target_start_right = data['target-position-start']['right'],
        target_start_left = data['target-position-start']['left'],
        target_start_bottom = data['target-position-start']['bottom'],
        target_end_top = data['target-position-end']['top'],
        target_end_right = data['target-position-end']['right'],
        target_end_left = data['target-position-end']['left'],
        target_end_bottom = data['target-position-end']['bottom'],
    )
    if data['click-time'] != -1:
        trial.click_time = data['click-time']
    if data['distance-px'] != -1:
        trial.distance_px = data['distance-px']
    if data['distance-m'] != -1:
        trial.distance_m = data['distance-m']
    trial.save(using='fogdetector')

def end_session(data):
    end = datetime.now(timezone.utc)
    s = Sessions.objects.using('fogdetector').get(django_key=data['user'])
    s.end = end
    s.save(using='fogdetector')
    
    alltrials = Trials.objects.using('fogdetector').filter(trial_options__set__training=False).exclude(distance_px__isnull=True)
    usertrials = alltrials.filter(session=s)

    if usertrials:
        user = {
            'distance-avg': str(round(usertrials.aggregate(Avg('distance_px'))['distance_px__avg'])),
            'distance-max': str(round(usertrials.aggregate(Max('distance_px'))['distance_px__max'])),
            'time-avg': '{0:.2f}'.format(usertrials.aggregate(Avg('click_time'))['click_time__avg']),
            'time-min': '{0:.2f}'.format(usertrials.aggregate(Min('click_time'))['click_time__min']),
            'time-max': '{0:.2f}'.format(usertrials.aggregate(Max('click_time'))['click_time__max']),
        }
    else:
        user = {
            'distance-avg': '-1',
            'distance-max': '-1',
            'time-avg': '-1',
            'time-min': '-1',
            'time-max': '-1',
        }

    if alltrials:
        all = {
            'distance-avg': str(round(alltrials.aggregate(Avg('distance_px'))['distance_px__avg'])),
            'distance-max': str(round(alltrials.aggregate(Max('distance_px'))['distance_px__max'])),
            'time-avg': '{0:.2f}'.format(alltrials.aggregate(Avg('click_time'))['click_time__avg']),
            'time-min': '{0:.2f}'.format(alltrials.aggregate(Min('click_time'))['click_time__min']),
            'time-max': '{0:.2f}'.format(alltrials.aggregate(Max('click_time'))['click_time__max']),
        }
    else:
        all = {
            'distance-avg': '-1',
            'distance-max': '-1',
            'time-avg': '-1',
            'time-min': '-1',
            'time-max': '-1',
        }

    return {
        'user': user,
        'all': all 
    }