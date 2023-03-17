.. _Installation:

============
Installation
============

Requirements and startup
========================

You need **Python 3.7** or above. This guide also assumes you are using **pip** as your python package manager and **venv**
as your python virtual environment.

Once you cloned the `lostinzoom-experiments repository <https://github.com/LostInZoom/lostinzoom-experiments>`_, you need to
modify some things before you can start developping or deploying your web application. A step-by-step guide is provided here
but you must have some basic knowledge of how Django works if you want to set it up quickly.

Before setting up the Django project, you will need to install `PostgreSQL <https://www.postgresql.org/>`_ with its extension
`PostGIS <https://postgis.net/>`_.

Automatic setup
===============

Two possibilities are offered: you can either install the :ref:`whole Django project <InstallProject>` or you can only install
a :ref:`simple Map Draw instance <MapDrawOnly>`.

.. _InstallProject:

The Django project
^^^^^^^^^^^^^^^^^^

You can easily setup automatically this Django project using the ``/setup.py`` file located in the root of the project directory.
Simply run the script using::

    $ python3 setup.py

It will start by installing all Python packages needed using pip. If you don't use pip, please install all the Python packages
of the ``/requirements.txt`` file manually or using your favourite Python package manager and launch the script again. You will
need to enter a secret Django key to secure the project::

    Secret key for the Django project [REQUIRED]:

Then, you will need to enter your IGN key and your Google API key if you have them::

    IGN key [OPTIONAL]:
    Google API key [OPTIONAL]:

You will be asked for your host/domain name::

    Host/domain name of your project (leave blank for localhost):

Then, you will need to provide your PostgreSQL credentials to create the database. You can choose an other user
than postgres to create and manage the database, but it is not advised to do so if you are not comfortable with
PostgreSQL configuration. You will most likely need to set it up as shown below::

    Connecting to PostgreSQL
    Please provide your PostgreSQL information to connect and create the database.
    Host: localhost
    Port: 5432
    User: postgres
    Password: postgres
    Creating the PostgreSQL database
    Database name: lizexp

Finally, Django will apply migrations for each individual applications, and you should be good to go. Simply run the
following command to start a development server on the port 8000::

    $ python3 manage.py runserver

.. _MapDrawOnly:

Standalone Map Draw
^^^^^^^^^^^^^^^^^^^

If you prefer to only install Map Draw as a standalone web application, you can as well. It is advised to do so
if you don't need the rest of the project as the Map Draw application doesn't rely on a database to run.
You can use the ``/setup.py`` file located in the root of the project directory.
Simply run the script using::

    $ python3 setup.py -s mapdraw

The ``-s`` flag in conjonction with ``mapdraw`` indicates that you want to install this application in standalone mode.
The beginning of the script is similar to the :ref:`Django project install <InstallProject>` but you don't need to provide
any database information. Instead, an SQLite database is created automatically to store Django's data (users, groups, migrations, etc.).

Manual setup
============

You can set up manually this Django project if you feel confident doing so and have a good knowledge of Django. This section
of the guide is a break-up of what the ``/setup.py`` file is changing inside the project directory. This guide assumes you are
using Linux.

First, install all the required packages::

    $ pip install -r requirements.txt

If your are not using PIP, here are the packages used::

    django
    psycopg2-binary
    pymemcache
    device_detector
    user_agents

Create a folder and a file like so::

    $ mkdir lizexp/private
    $ vim lizexp/private/privacy.py

Populate the ``lizexp/private/privacy.py`` file like so::

    DJANGO_SECRET_KEY = '' # Provide a secret key for your project
    IGN_SECRET_KEY = '' # Enter your IGN key if you have one
    GOOGLE_SECRET_KEY = '' # Enter your Google API key if you have one
    ALLOWED_OWN_HOSTS = ['127.0.0.1', 'localhost'] # Add your host/domain name to this list

Continue this guide for the :ref:`whole Django project <ManualInstallProject>` or for a
:ref:`simple Map Draw instance <ManualMapDrawOnly>`.

.. _ManualInstallProject:

The Django project
^^^^^^^^^^^^^^^^^^

If you want to install the full Django project, add the following lines to the ``lizexp/private/privacy.py`` file::

    DB_NAME = 'lizexp' # Enter the name of the database you created 
    DB_HOST = 'localhost' # Your database host
    DB_PORT = '5432' # The port
    DB_USER = 'postgres' # The user
    DB_PWD = 'postgres' # The user's password

Create a new database, conect to that new database, create the PostGIS extension and the applications schema::

    $ sudo -u postgres psql
    postgres=# CREATE DATABASE lizexp OWNER postgres;
    postgres=# \c lizexp
    lizexp=# CREATE EXTENSION postgis;
    lizexp=# CREATE SCHEMA anchorwhat;
    lizexp=# CREATE SCHEMA deepmapdraw;
    lizexp=# CREATE SCHEMA fogdetector;
    lizexp=# \quit

Then copy/paste and overwrite both of those files::

    $ cp lizexp/setup/lizexp/settings.py lizexp/settings.py
    $ cp lizexp/setup/lizexp/urls.py lizexp/urls.py

Apply the migration of your Django project::

    $ python3 manage.py migrate

Now, make and apply individually all migrations for each applications::

    $ python3 manage.py makemigrations anchorwhat
    $ python3 manage.py migrate anchorwhat --database=anchorwhat
    $ python3 manage.py makemigrations deepmapdraw
    $ python3 manage.py migrate deepmapdraw --database=deepmapdraw
    $ python3 manage.py makemigrations fogdetector
    $ python3 manage.py migrate fogdetector --database=fogdetector

Finally, run the development server on the port 8000 using::

    $ python3 manage.py runserver

.. _ManualMapDrawOnly:

Standalone Map Draw
^^^^^^^^^^^^^^^^^^^

If you want a standalone Map Draw instance, copy/paste and overwrite both of those files::

    $ cp lizexp/setup/standalone/mapdraw/settings.py lizexp/
    $ cp lizexp/setup/standalone/mapdraw/urls.py lizexp/

Then, apply the migrations to your Django project. This will create a SQLite database inside the project root directory::

    $ python3 manage.py migrate

Finally, run the development server on the port 8000 using::

    $ python3 manage.py runserver