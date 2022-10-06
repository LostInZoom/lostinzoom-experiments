from fogdetector.models import TrialsOptions, Sets
from lizexp.private.privacy import IGN_SECRET_KEY, GOOGLE_SECRET_KEY
import json, csv, os

def get_file(filename, app, ext):
        return open(app + '/static/' + app + '/conf/' + filename + '.' + ext, encoding='utf-8')

def get_JSON(filename, app):
    l = json.load(get_file(filename, app, 'json'))
    return l

def get_CSV(filename, app):
    reader = csv.DictReader(get_file(filename, app, 'csv'))
    targets = {}
    for row in reader:
        id = int(row['id'])
        row.pop('id')
        targets[id] = row
    return targets

def clean_pages(app):
    def page_int(e):
        return int(e.replace('page', '').replace('.json', ''))
    jsons = os.listdir(app + '/static/' + app + '/conf/pages/')
    jsons.sort(key = page_int)
    return jsons

def get_pages(app):
    jsons = clean_pages(app)
    pages = []
    for page in jsons:
        pages.append(get_JSON('pages/' + page.replace('.json', ''), app))
    return pages

def get_trials(training):
    sets = Sets.objects.using('fogdetector').filter(training=training)
    trials = []
    for set in sets:
        sstrials = TrialsOptions.objects.using('fogdetector').filter(set=set.id, scale='small')
        ss = []
        for sstrial in sstrials:
            ss.append({
                'id': sstrial.id,
                'options': sstrial.options
            })
        
        lstrials = TrialsOptions.objects.using('fogdetector').filter(set=set.id, scale='large')
        ls = []
        for lstrial in lstrials:
            ls.append({
                'id': lstrial.id,
                'options': lstrial.options
            })

        if len(ss) > 0 and len(ls) > 0:
            obj = {'smallScale': ss, 'largeScale': ls, 'guide': set.guide}
        else:
            if len(ss) > 0:
                obj = {'largeScale': ss, 'guide': set.guide}
            elif len(ls) > 0:
                obj = {'largeScale': ls, 'guide': set.guide}
            else:
                obj = {}

        trials.append(obj)
    return trials

def retrieve_configuration(app):
    p = get_pages(app)
    g = get_JSON('general', app)
    g['pages']['total'] = len(p)
    return {
        "general": g,
        "cartography": get_JSON('cartography', app),
        "texts": get_JSON('texts', app),
        "pages": p,
        "trainings": get_trials(True),
        "sessions": get_trials(False),
        "targets": get_CSV('targets', app),
        "keys": {
            "ign": IGN_SECRET_KEY,
            "google": GOOGLE_SECRET_KEY
        }
    }