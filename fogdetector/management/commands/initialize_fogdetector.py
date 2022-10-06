from django.core.management.base import BaseCommand
from fogdetector.api.initialization import initialize_application
from lizexp.api.management import eraseWarning

class Command(BaseCommand):
    help = 'Initialize application'

    def handle(self, *args, **options):
        doit = eraseWarning('Fog Detector')
        if (doit):
            print('INITIALIZING FOG DETECTOR...')
            initialize_application('fogdetector')
        else:
            print('Nothing was done')