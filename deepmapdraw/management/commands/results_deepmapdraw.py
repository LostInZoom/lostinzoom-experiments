from django.core.management.base import BaseCommand
from lizexp.api.database import execute_query
from datetime import datetime
import datetime, csv

def retrieve_sessions(sessions):
    query = """
        select s.id, s.device, s.os, s.browser, s.user_agent, s.screen_width, s.screen_height
        from deepmapdraw.sessions s
        order by id
    """
    data = execute_query('deepmapdraw', query)
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

def retrieve_trials(sessions):
    layersquery = '''
        with layers as (
            select l.id, l.set, l.start, l.end, l.layer, l.number, l.name, l.color, ST_AsText(l.geom) as wkt
            from deepmapdraw.layers l
        )
        select l.id, s.session, s.start as set_start, s.end as set_end, s.basemap, s.zoom, s.center_x, s.center_y, s.x_min, s.x_max, s.y_min, s.y_max, l.start as layer_start, l.end as layer_end, l.layer, l.number, l.name, l.color, l.wkt
        from deepmapdraw.sets s
        inner join layers l
        on l.set = s.id
        order by s.session, s.id, l.id
    '''
    layers = execute_query('deepmapdraw', layersquery)

    for dcol in layers['cols']:
        if dcol != 'trialid':
            sessions['drawings']['cols'].append(dcol)

    for d in layers['rows']:
        entry = []
        for e in d:
            entry.append(e)
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
        sessions = retrieve_trials(sessions)

        time = datetime.datetime.now()

        for s in sessions:
            filename = "lizexp/results/deepmapdraw/deepmapdraw-{0}{1}{2}{3}{4}{5}-{6}.csv".format(time.year, time.month, time.day, time.hour, time.minute, time.second, s)
            with open(filename, 'w') as csvfile:
                fw = csv.writer(csvfile, delimiter='|')
                fw.writerow(sessions[s]['cols'])
                for row in sessions[s]['rows']:
                    fw.writerow(row)