from django.core.management.base import BaseCommand
from lizexp.api.database import execute_query
from datetime import datetime
import datetime, csv

def retrieve_sessions(sessions):
    query = """
        select s.id, s.start, s.end, s.device, s.os, s.browser, s.user_agent, s.screen_width, s.screen_height
        from fogdetector.sessions s
        order by id
    """
    data = execute_query('fogdetector', query)
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
        from fogdetector.pages
        order by id
    """
    pages = execute_query('fogdetector', pagequery)
    for p in pages['rows']:
        sessions['sessions']['cols'].append('time_on_page' + str(p[0]))
        page_nb.append(p[0])

    timequery = """
        select session, page_number, duration_ms
        from fogdetector.page_time
        order by session, page_number
    """
    pagetime = execute_query('fogdetector', timequery)

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
        from fogdetector.questions
        order by id
    """
    questions = execute_query('fogdetector', questionquery)
    for q in questions['rows']:
        sessions['sessions']['cols'].append(str(q[2]))
        questionnb.append(q[0])

    answerquery = """
        select answer, question, session
        from fogdetector.survey
        order by question
    """
    answers = execute_query('fogdetector', answerquery)
    for row in sessions['sessions']['rows']:
        for nb in questionnb:
            answer = 'no answer'
            for a in answers['rows']:
                if a[2] == row[0] and a[1] == nb:
                    answer = a[0]
            row.append(answer)
    return sessions

def retrieve_trials(sessions):
    trialsquery = '''
        select tr.session, s.training, s.number as set_number, tr.trial_position,
            opt.type as trial_type, opt.subtype as trial_subtype, opt.basemap,
            targ.id as target_id, targ.name as location, targ.type as target_type, targ.x, targ.y,
            tr.duration_ms, tr.click_time, tr.distance_px, tr.distance_m,
            tr.target_start_top, tr.target_start_right, tr.target_start_bottom, tr.target_start_left,
            tr.target_end_top, tr.target_end_right, tr.target_end_bottom, tr.target_end_left
        from fogdetector.trials tr
        inner join fogdetector.trials_options opt
        on opt.id = tr.trial_options
        inner join fogdetector.sets s
        on s.id = opt.set
        inner join fogdetector.targets targ
        on tr.target = targ.id
        order by session, training, set_number, trial_position
    '''
    trials = execute_query('fogdetector', trialsquery)

    for tcol in trials['cols']:
        sessions['trials']['cols'].append(tcol)

    for t in trials['rows']:
        entry = []
        for e in t:
            entry.append(e)
        sessions['trials']['rows'].append(entry)
    return sessions

class Command(BaseCommand):
    help = 'Retrieve application results'

    def handle(self, *args, **options):
        sessions = {
            'sessions': {
                'cols': [],
                'rows': []
            },
            'trials': {
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
            filename = "lizexp/results/fogdetector/fogdetector-{0}{1}{2}{3}{4}{5}-{6}.csv".format(time.year, time.month, time.day, time.hour, time.minute, time.second, s)
            with open(filename, 'w') as csvfile:
                fw = csv.writer(csvfile, delimiter='|')
                fw.writerow(sessions[s]['cols'])
                for row in sessions[s]['rows']:
                    fw.writerow(row)