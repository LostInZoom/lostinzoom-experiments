class AuthRouter:
    """
    A router to control all database operations on models in the
    auth and contenttypes applications.
    """
    route_app_labels = {'auth', 'contenttypes', 'admin', 'sessions', 'sites'}

    def db_for_read(self, model, **hints):
        """
        Attempts to read auth and contenttypes models go to django.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'django'
        return None

    def db_for_write(self, model, **hints):
        """
        Attempts to write auth and contenttypes models go to django.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'django'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if a model in the auth or contenttypes apps is
        involved.
        """
        if (
            obj1._meta.app_label in self.route_app_labels or
            obj2._meta.app_label in self.route_app_labels
        ):
           return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the auth and contenttypes apps only appear in the
        'django' database.
        """
        if app_label in self.route_app_labels:
            return db == 'django'
        return None

class FogDetectorRouter:
    """
    A router to control all database operations on models in the
    fogdetector application.
    """
    route_app_labels = {'fogdetector'}

    def db_for_read(self, model, **hints):
        """
        Attempts to read fogdetector models go to fogdetector.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'fogdetector'
        return None

    def db_for_write(self, model, **hints):
        """
        Attempts to write fogdetector models go to fogdetector.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'fogdetector'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if a model in the fogdetector app is
        involved.
        """
        if (
            obj1._meta.app_label in self.route_app_labels or
            obj2._meta.app_label in self.route_app_labels
        ):
           return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the fogdetector apps only appear in the
        'fogdetector' database.
        """
        if app_label in self.route_app_labels:
            return db == 'fogdetector'
        return None
    
class AnchorwhatRouter:
    """
    A router to control all database operations on models in the
    anchorwhat application.
    """
    route_app_labels = {'anchorwhat'}

    def db_for_read(self, model, **hints):
        """
        Attempts to read anchorwhat models go to anchorwhat.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'anchorwhat'
        return None

    def db_for_write(self, model, **hints):
        """
        Attempts to write fogdetector models go to fogdetector.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'anchorwhat'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if a model in the anchorwhat app is
        involved.
        """
        if (
            obj1._meta.app_label in self.route_app_labels or
            obj2._meta.app_label in self.route_app_labels
        ):
           return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the anchorwhat apps only appear in the
        'anchorwhat' database.
        """
        if app_label in self.route_app_labels:
            return db == 'anchorwhat'
        return None