from anchorwhat.api.initialization import initialize_application
from anchorwhat.api.configuration import retrieve_configuration

# 2 modes possibles :
# 'm': Migration mode, no operations made on database
# 'd': Deployment mode, retrieve configuration from database
APPLICATION_MODE = 'd'

if APPLICATION_MODE == 'm':
        print('Anchorwhat migration mode.')
else:
    try:
        # App configuration is stored
        APP_CONFIGURATION = retrieve_configuration('anchorwhat')
    except:
        pass