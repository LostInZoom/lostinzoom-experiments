from django.core.management.base import BaseCommand
from anchorwhat.api.initialization import initialize_application
from lizexp.api.management import eraseWarning

class Command(BaseCommand):
    help = 'Initialize application'

    def handle(self, *args, **options):
        doit = eraseWarning('Anchorwhat')
        if (doit):
            print('INITIALIZING ANCHORWHAT...')
            initialize_application('anchorwhat')
        else:
            print('Nothing was done')