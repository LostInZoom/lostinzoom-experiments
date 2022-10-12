import json, csv, os
from lizexp.private.privacy import *

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
        targets[id] = row
    return targets

def retrieve_configuration(app):
    return {
        "cartography": get_JSON('cartography', app),
        "drawing": get_JSON('drawing', app),
        "keys": {
            "ign": IGN_SECRET_KEY,
            "google": GOOGLE_SECRET_KEY
        }
    }