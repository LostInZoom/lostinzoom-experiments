#!/usr/bin/env python
import os, sys, subprocess, argparse, shutil, django
from lizexp.api.management import promptWarning, fileLinesToSet

def install_lostinzoom_experiments(params):
    # Add a variable to check if the user is sure about the operation.
    doit = promptWarning('This operation will bring modification to this django project.\nProceed? (yes/y or no/n)\n')
    if (doit):
        print('Setting up LostInZoom Experiments...')
        print('Installing pip dependencies...')
        try:
            # Stores required packages to install inside a set
            required = fileLinesToSet('requirements.txt')
            # Installing every pip packages from the set
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', *required])
        except:
            print("pip is not installed. Either install pip or install the dependencies yourself before running this script.")
            sys.exit()

        print('Creating private file...')
        private_path = r'lizexp/private'
        if not os.path.exists(private_path):
            os.makedirs(private_path)

        django_key = input(f"Secret key for the Django project [REQUIRED]: ")
        ign_key = input(f"IGN key [OPTIONAL]: ")
        google_key = input(f"Google API key [OPTIONAL]: ")
        new_host = input(f"Host/domain name of your project (leave blank for localhost): ")

        privacy = private_path + '/privacy.py'
        if os.path.exists(privacy):
            os.remove(privacy)

        with open(privacy,'a') as f:
            f.write(
                "DJANGO_SECRET_KEY = '{0}'\n".format(django_key) +
                "IGN_SECRET_KEY = '{0}'\n".format(ign_key) +
                "GOOGLE_SECRET_KEY = '{0}'\n".format(google_key)
            )
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
            sqlite = r'sqlite.db'
            if os.path.exists(sqlite):
                os.remove(sqlite)
            print("Setting up whole Django project")
            import psycopg2
            print("Connecting to PostgreSQL")
            print("Please provide your PostgreSQL's informations to connect and create the database.")
            dbhost = input(f"Host: ")
            dbport = input(f"Port: ")
            dbuser = input(f"User: ")
            dbpwd = input(f"Password: ")
            postgres = psycopg2.connect(database='postgres', user=dbuser, password=dbpwd, host=dbhost, port=int(dbport))
            postgres.autocommit = True
            print("Creating the PostgreSQL database")
            dbname = input(f"Database name: ")
            with postgres.cursor() as cursor:
                cursor.execute("SELECT datname FROM pg_database;")
                list_database = cursor.fetchall()
                if (dbname,) in list_database:
                    print("{0} database already exists.".format(dbname))
                else:
                    print("{0} database does not exist. Creating it.".format(dbname))
                    sql = 'CREATE DATABASE {0} OWNER {1};'.format(dbname, dbuser)
                    cursor.execute(sql)
                postgres.close()
            lizexpdb = psycopg2.connect(database=dbname, user=dbuser, password=dbpwd, host=dbhost, port=int(dbport))
            lizexpdb.autocommit = True
            with lizexpdb.cursor() as cursor:
                sql = '''
                    CREATE EXTENSION IF NOT EXISTS postgis;
                    CREATE SCHEMA IF NOT EXISTS anchorwhat;
                    CREATE SCHEMA IF NOT EXISTS deepmapdraw;
                    CREATE SCHEMA IF NOT EXISTS fogdetector;
                '''
                cursor.execute(sql)
                lizexpdb.close()

            with open(privacy,'a') as f:
                f.write(
                    "\nDB_NAME = '{0}'\n".format(dbname) + 
                    "DB_HOST = '{0}'\n".format(dbhost) +
                    "DB_PORT = '{0}'\n".format(dbport) +
                    "DB_USER = '{0}'\n".format(dbuser) +
                    "DB_PWD = '{0}'\n".format(dbpwd)
                )
                f.close()
            
            shutil.copyfile(r'lizexp/setup/lizexp/settings.py', r'lizexp/settings.py')
            shutil.copyfile(r'lizexp/setup/lizexp/urls.py', r'lizexp/urls.py')
            subprocess.call(["python3", "manage.py", "migrate"])
            subprocess.call(["python3", "manage.py", "makemigrations", "anchorwhat"])
            subprocess.call(["python3", "manage.py", "migrate", "anchorwhat", "--database=anchorwhat"])
            subprocess.call(["python3", "manage.py", "makemigrations", "deepmapdraw"])
            subprocess.call(["python3", "manage.py", "migrate", "deepmapdraw", "--database=deepmapdraw"])
            subprocess.call(["python3", "manage.py", "makemigrations", "fogdetector"])
            subprocess.call(["python3", "manage.py", "migrate", "fogdetector", "--database=fogdetector"])

            subprocess.call(["python3", "manage.py", "initialize_anchorwhat", "--nocheck"])
            subprocess.call(["python3", "manage.py", "initialize_fogdetector", "--nocheck"])
            
    else:
        print('Nothing was done')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Set up LostInZoom Experiments' django project.")
    parser.add_argument('-s', '--standalone', type=str, help='Standalone mode. Install only the specified application. (Only works for mapdraw).')
    
    params = parser.parse_args()
    install_lostinzoom_experiments(params)