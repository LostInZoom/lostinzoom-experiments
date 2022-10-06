from anchorwhat.api.configuration import get_CSV, clean_pages, get_JSON
from anchorwhat.api.database import clean_tables
from anchorwhat.models import Pages, Sets, Questions

def initialize_pages(app):
    jsons = clean_pages(app)
    for page in jsons:
        pageDB = Pages()
        pageDB.save()
         
def initialize_forms(app):
    def getQuestions(q, content):
        for c in content:
            q.append(c['question']['text']['en'].replace('<br>', ' '))
            if 'cascading' in c:
                q = getQuestions(q, c['cascading']['content'])
        return q
    
    jsons = clean_pages(app)
    pagenb = 1
    for page in jsons:
        p = get_JSON('pages/' + page.replace('.json', ''), app)
        questions = []
        pageI = Pages.objects.get(id=pagenb)
        for element in p:
            if element['type'] == 'form':
                questions = getQuestions(questions, element['content'])
        questionNb = 1
        for q in questions:        
            question = Questions(
                page_number = pageI,
                question = q,
                number = questionNb
            )
            question.save()
            questionNb += 1
        pagenb += 1

def initialize_sets(app):
    locations = get_CSV('locations', app)
    for l in locations:
        data = locations[l]
        trial = Sets(
            x = int(data['x']),
            y = int(data['y']),
            location = data['location'],
            basemap = data['basemap']
        )
        trial.save()

def initialize_application(app):
    print('cleaning tables...')
    clean_tables(
        app,
        'survey', 'questions',
        'page_time', 'pages', 'drawing',
        'trials', 'sets', 'sessions'
        )
    print('Initialize experiment')
    print('setting up pages...')
    initialize_pages(app)
    print('setting up forms...')
    initialize_forms(app)
    print('setting up experiment sets...')
    initialize_sets(app)
    print('initialization done.')