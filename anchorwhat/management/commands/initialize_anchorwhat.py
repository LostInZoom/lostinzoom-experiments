from django.core.management.base import BaseCommand
from anchorwhat.api.initialization import initialize_application
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
            doit = databaseClearingWarning('Anchorwhat')
        if (doit):
            print('INITIALIZING ANCHORWHAT...')
            initialize_application('anchorwhat')
        else:
            print('Nothing was done')