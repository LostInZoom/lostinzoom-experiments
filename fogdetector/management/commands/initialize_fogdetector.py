from django.core.management.base import BaseCommand
from fogdetector.api.initialization import initialize_application
from lizexp.api.management import databaseClearingWarning

class Command(BaseCommand):
    help = 'Initialize application'

    def add_arguments(self, parser):
        parser.add_argument(
            '--nocheck',
            action='store_true',
            help='Ignore warning and proceed.',
        )

    def handle(self, *args, **options):
        if options['nocheck']:
            doit = True
        else:
            doit = databaseClearingWarning('Fog Detector')
        if (doit):
            print('INITIALIZING FOG DETECTOR...')
            initialize_application('fogdetector')
        else:
            print('Nothing was done')