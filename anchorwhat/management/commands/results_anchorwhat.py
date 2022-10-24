from django.core.management.base import BaseCommand
from django.forms.models import model_to_dict
from lizexp.api.database import execute_query
# from anchorwhat.models import Sessions, Pages, Sets, Targets, Questions, Survey
from django.db import connections
from datetime import datetime
import datetime, csv, json

def retrieve_sessions(sessions):
    query = """
        select s.id, s.start, s.end, s.device, s.os, s.browser, s.user_agent, s.screen_width, s.screen_height
        from anchorwhat.sessions s
        order by id
    """
    data = execute_query('anchorwhat', query)
    for col in data['cols']:
        sessions['sessions']['cols'].append(col)
    for row in data['rows']:
        entry = []
        for field in row:
            if isinstance(field, datetime.datetime):
                value = field.strftime('%d-%m-%Y, %H:%M:%S')
            elif field is None:
                value = ''
            else:
                value = field
            entry.append(value)
        sessions['sessions']['rows'].append(entry)
    return sessions

def retrieve_pages(sessions):
    page_nb = []
    pagequery = """
        select id
        from anchorwhat.pages
        order by id
    """
    pages = execute_query('anchorwhat', pagequery)
    for p in pages['rows']:
        sessions['sessions']['cols'].append('time_on_page' + str(p[0]))
        page_nb.append(p[0])

    timequery = """
        select session, page_number, duration_ms
        from anchorwhat.page_time
        order by session, page_number
    """
    pagetime = execute_query('anchorwhat', timequery)

    for row in sessions['sessions']['rows']:
        for nb in page_nb:
            duration = ''
            for pt in pagetime['rows']:
                if pt[0] == row[0] and pt[1] == nb:
                    duration = pt[2]
            row.append(duration)
    return sessions

def retrieve_survey(sessions):
    questionnb = []
    questionquery = """
        select id, number, question
        from anchorwhat.questions
        order by id
    """
    questions = execute_query('anchorwhat', questionquery)
    for q in questions['rows']:
        sessions['sessions']['cols'].append(str(q[2]))
        questionnb.append(q[0])

    answerquery = """
        select answer, question, session
        from anchorwhat.survey
        order by question
    """
    answers = execute_query('anchorwhat', answerquery)
    for row in sessions['sessions']['rows']:
        for nb in questionnb:
            answer = 'no answer'
            for a in answers['rows']:
                if a[2] == row[0] and a[1] == nb:
                    answer = a[0]
            row.append(answer)
    return sessions

def retrieve_trials(sessions):
    drawingsquery = '''
        with drawings as (
            select d.trial, d.layer, max(d.importance) as importance, ST_AsText(ST_Multi(ST_Union(d.geom_poly))) as wkt
            from anchorwhat.drawing d
            group by d.trial, d.layer
        )
        select t.id as trialid, t.session, s.location, s.basemap, t.zoom, t.duration_ms, layer as layernumber,''::varchar(20000) as layername, d.importance, d.wkt
        from anchorwhat.trials t
        inner join drawings d
        on d.trial = t.id
        inner join anchorwhat.sets s
        on t.set = s.id
        order by t.session
    '''
    drawings = execute_query('anchorwhat', drawingsquery)
    layersnamequery = '''
        select id, layer1, layer2, layer3, layer4, layer5
        from anchorwhat.trials
    '''
    layersname = execute_query('anchorwhat', layersnamequery)

    for dcol in drawings['cols']:
        if dcol != 'trialid':
            sessions['drawings']['cols'].append(dcol)

    for d in drawings['rows']:
        entry = []
        trialid = d[0]
        layernumber = d[6]
        index = 0
        for e in d:
            if index != 0:
                entry.append(e)
            index += 1
        for layer in layersname['rows']:
            if layer[0] == trialid:
                entry[6] = layer[layernumber]
        sessions['drawings']['rows'].append(entry)
    return sessions

class Command(BaseCommand):
    help = 'Retrieve application results'

    def handle(self, *args, **options):
        sessions = {
            'sessions': {
                'cols': [],
                'rows': []
            },
            'drawings': {
                'cols': [],
                'rows': []
            }
        }
        sessions = retrieve_sessions(sessions)
        sessions = retrieve_pages(sessions)
        sessions = retrieve_survey(sessions)
        sessions = retrieve_trials(sessions)

        time = datetime.datetime.now()

        for s in sessions:
            filename = "lizexp/results/anchorwhat-{0}{1}{2}{3}{4}{5}-{6}.csv".format(time.year, time.month, time.day, time.hour, time.minute, time.second, s)
            with open(filename, 'w') as csvfile:
                fw = csv.writer(csvfile, delimiter='|')
                fw.writerow(sessions[s]['cols'])
                for row in sessions[s]['rows']:
                    fw.writerow(row)