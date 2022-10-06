from django.core.management.base import BaseCommand
from django.forms.models import model_to_dict
from lizexp.api.database import execute_query
from fogdetector.models import Sessions, Pages, TrialsOptions, Sets, Targets, Questions, Survey
from django.db import connections
from datetime import datetime
import datetime, csv, json

def retrieve_sessions():
    query = """
        select *
        from fogdetector.sessions
        order by id
    """
    data = execute_query('fogdetector', query)
    results = []
    for row in data['rows']:
        col = 0
        entry = {}
        for field in row:
            if isinstance(field, datetime.datetime):
                value = field.strftime('%d-%m-%Y, %H:%M:%S')
            elif field is None:
                value = ''
            else:
                value = field
            entry[data['cols'][col]] = value
            col += 1
        results.append(entry)
    return results

    

def retrieve_pages(sessions):
    pagequery = """
        select id
        from fogdetector.pages
        order by id
    """
    pages = execute_query('fogdetector', pagequery)
    for page in pages['rows']:
        for col in page:
            for entry in sessions:
                entry['time_on_page' + str(col)] = ''

    timequery = """
        select session, page_number, duration_ms
        from fogdetector.page_time
        order by session, page_number
    """
    pagetime = execute_query('fogdetector', timequery)
    for time in pagetime['rows']:
        for session in sessions:
            if time[0] == session['id']:
                session['time_on_page' + str(time[1])] = time[2]

    return sessions

class Command(BaseCommand):
    help = 'Retrieve application results'

    def handle(self, *args, **options):
        sessions = retrieve_sessions()
        sessions = retrieve_pages(sessions)

        print(sessions)

        # time = datetime.datetime.now()
        # filename = "lizexp/results/{0}{1}{2}{3}{4}{5}-results-fogdetector".format(time.year, time.month, time.day, time.hour, time.minute, time.second)
        # with open(filename, 'w') as csvfile:
        #     fw = csv.writer(csvfile, delimiter=',')
        #     fw.writerow(['Name', 'Profession'])
        #     fw.writerow(['Derek', 'Software Developer'])
        #     fw.writerow(['Steve', 'Software Developer'])
        #     fw.writerow(['Paul', 'Manager'])