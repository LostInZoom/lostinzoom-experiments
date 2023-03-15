#!/usr/bin/env python
import os, sys, subprocess, argparse, shutil
from lizexp.api.management import promptWarning, fileLinesToSet

def install_lostinzoom_experiments(params):
    doit = promptWarning('This operation will bring modification to this django project.\nProceed? (yes/y or no/n)\n')
    if (doit):
        print('Setting up LostInZoom Experiments...')
        print('Installing pip dependencies...')
        required = fileLinesToSet('requirements.txt')
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', *required])

        print('Creating private file...')
        private_path = r'lizexp/private'
        if not os.path.exists(private_path):
            os.makedirs(private_path)

        django_key = input(f"Enter a secret key for this particular Django installation." +
            "This is used to provide cryptographic signing, and should be set to a unique, unpredictable value.\n" +
            "You can leave it blank and update it later.\n")

        ign_key = input(f"Enter a IGN Geoservices key to use IGN Basemaps. Some of them (Plan IGN) does not require a key.\n" +
            "Leave blank if you don't intend to use it or prefer to provide it later.\n")

        google_key = input(f"Enter a Google API key to use Google Basemaps.\n" +
            "Leave blank if you don't intend to use it or prefer to provide it later.\n")

        new_host = input(f"Type in the host/domain name that this site will serve\n" +
            "It can be www.example.com as well as an ip adress. Leave blank for local:\n")

        privacy = private_path + '/privacy.py'
        if os.path.exists(privacy):
            os.remove(privacy)

        with open(privacy,'a') as f:
            f.write("DJANGO_SECRET_KEY = '{0}'\n".format(django_key) +
                "IGN_SECRET_KEY = '{0}'\n".format(ign_key) +
                "GOOGLE_SECRET_KEY = '{0}'\n".format(google_key))
            if len(new_host) > 0:
                f.write("ALLOWED_OWN_HOSTS = ['127.0.0.1', 'localhost', '{0}']\n".format(new_host))
            else:
                f.write("ALLOWED_OWN_HOSTS = ['127.0.0.1', 'localhost']\n")
            f.close()

        standalone=params.standalone
        if standalone is not None:
            if standalone == 'mapdraw':
                print("Setting up standalone mapdraw application")
                shutil.copyfile(r'lizexp/setup/standalone/mapdraw/settings.py', r'lizexp/settings.py')
                shutil.copyfile(r'lizexp/setup/standalone/mapdraw/urls.py', r'lizexp/urls.py')
                print("Creating the dummy db.")
                subprocess.call(["python3", "manage.py", "migrate"])
                print("Standalone mapdraw application successfully setup. You can use the following command...\n" +
                    "python3 manage.py runserver\n" +
                    "...to launch a development server on port 8000 and test the application.")
        else:
            print("Setting up full fledge project")
            shutil.copyfile(r'lizexp/setup/lizexp/settings.py', r'lizexp/settings.py')
            shutil.copyfile(r'lizexp/setup/lizexp/urls.py', r'lizexp/urls.py')
            sqlite = r'sqlite.db'
            if os.path.exists(sqlite):
                os.remove(sqlite)
    else:
        print('Nothing was done')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Set up LostInZoom Experiments' django project.")
    parser.add_argument('-s', '--standalone', type=str, help='Standalone mode. Install only the specified application. (Only works for mapdraw).')
    
    params = parser.parse_args()
    install_lostinzoom_experiments(params)