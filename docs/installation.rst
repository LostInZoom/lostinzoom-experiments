.. _Installation:

============
Installation
============

Requirements and startup
========================

You need **Python 3.7** or above. This guide also assumes you are using **PIP** as your python package manager and **venv**
as your python virtual environment.

Once you cloned the `lostinzoom-experiments repository <https://github.com/LostInZoom/lostinzoom-experiments>`_, you need to
modify some things before you can start developping or deploying your web application. A step-by-step guide is provided here
but you must have some basic knowledge of how Django works if you want to set it up quickly.

Two possibilities are offered: you can either install the :ref:`whole Django project <InstallProject>` or you can only install
a :ref:`simple Map Draw instance <MapDrawOnly>`.

.. _InstallProject:

The Django project
==================

Before setting up the Django project, you will need to install `PostgreSQL <https://www.postgresql.org/>`_ with its extension
`PostGIS <https://postgis.net/>`_.

You can easily setup automatically this Django project using the ``/setup.py`` file located in the root of the project directory.

.. _MapDrawOnly:

Standalone Map Draw
===================

Install required packages::

    pip install -r requirements.txt

If your are not using PIP, here are the packages used::

    django
    psycopg2-binary
    pymemcache
    device_detector
    user_agents

Standalone Map Draw version
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

To install Map Draw as a standalone web application, the first step is to remove the
all unwanted files as well as all their references inside the code. Even if this is not too cumbersome
this process is meant to be simplified in the future.

Edit the file ``lizexp/lizexp/settings.py`` and remove the following lines::

    DATABASES = {
        'default': DJANGO_DATABASE,
        'fogdetector': FOG_DETECTOR_DATABASE,
        'anchorwhat': ANCHORWHAT_DATABASE,
    }

Delete the following folder from the ``lizexp/`` directory::

    lizexp/anchorwhat/
    lizexp/docs/
    lizexp/fogdetector/
    lizexp/home/



Usage
=======