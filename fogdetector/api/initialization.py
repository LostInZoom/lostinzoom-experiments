from fogdetector.api.configuration import get_CSV, clean_pages, get_JSON
from fogdetector.api.database import clean_tables
from fogdetector.models import Pages, TrialsOptions, Sets, Targets, Questions
import json

def initialize_targets(app):
    targets = get_CSV('targets', app)
    for t in targets:
        o = targets[t]
        new = Targets(
            name = o['location'],
            scale = o['scale'],
            type = o['type'],
            x = int(o['x']),
            y = int(o['y']),
        )
        new.save(using='fogdetector')

def initialize_pages(app):
    jsons = clean_pages(app)
    for page in jsons:
        pageDB = Pages()
        pageDB.save(using='fogdetector')
         
def initialize_forms(app):
    jsons = clean_pages(app)
    pagenb = 1
    for page in jsons:
        p = get_JSON('pages/' + page.replace('.json', ''), app)
        for element in p:
            if element['type'] == 'form':
                #print(element)
                questionNb = 1
                pageI = Pages.objects.using('fogdetector').get(id=pagenb)
                for content in element['content']:
                    question = Questions(
                        page_number = pageI,
                        question = content['question']['text']['en'].replace('<br>', ' '),
                        number = questionNb
                    )
                    question.save()
                    questionNb += 1
        pagenb += 1

def initialize_sets(app):
    def initialize_trials(trials, set, scale):
        t = trials.split()
        type = t[0]
        if t[0] == 'zoomin':
            type = 'zoom in'
        elif t[0] == 'zoomout':
            type = 'zoom out'
        subtype = t[1]
        if t[1] == 'ls':
            subtype = 'large scale'
        elif t[1] == 'ss':
            subtype = 'small scale'
        elif t[1] == 'lg':
            subtype = 'large gap'
        elif t[1] == 'sg':
            subtype = 'small gap'
        basemap = t[2]
        if t[2] == 'osm':
            basemap = 'OpenStreetMap'
        elif t[2] == 'mign':
            basemap = 'Cartes IGN'
        elif t[2] == 'pign':
            basemap = 'Plan IGN'
        trial = TrialsOptions(
            set = set,
            type = type,
            subtype = subtype,
            basemap = basemap,
            options = trials,
            scale = scale
        )
        trial.save(using='fogdetector')

    def create_sets(list, training):
        nb = 1
        for s in list:
            guide = 0
            if training:
                guide = s['nbGuide']
            set = Sets(training = training, number = nb, guide=guide)
            set.save(using='fogdetector')
            if 'largeScale' in s:
                for ls in s['largeScale']:
                    initialize_trials(ls, set, 'large')
            if 'smallScale' in s:
                for ss in s['smallScale']:
                    initialize_trials(ss, set, 'small')
            nb += 1
    
    s = get_JSON('sessions', app)
    t = get_JSON('trainings', app)
    create_sets(s, False)
    create_sets(t, True)

def initialize_application(app):
    print('cleaning tables...')
    clean_tables(
        'fogdetector',
        'survey', 'questions',
        'page_time', 'pages',
        'trials', 'trials_options',
        'sets', 'targets',
        'sessions'
        )
    print('Initialize experiment')
    print('setting up pages...')
    initialize_pages(app)
    print('setting up forms...')
    initialize_forms(app)
    print('setting up targets...')
    initialize_targets(app)
    print('setting up experiment sets...')
    initialize_sets(app)
    print('initialization done.')