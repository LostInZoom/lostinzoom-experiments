from fogdetector.api.initialization import initialize_application
from fogdetector.api.configuration import retrieve_configuration

# 3 modes possibles :
# 'm': Migration mode, no operations made on database
# 'd': Deployment mode, retrieve configuration from database
APPLICATION_MODE = 'd'

if APPLICATION_MODE == 'm':
    print('Fog Detector migration mode.')
else:
    # App configuration is stored
    APP_CONFIGURATION = retrieve_configuration('fogdetector')