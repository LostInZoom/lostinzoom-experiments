from django.contrib.gis.db import models

# Create your models here.
class Sessions(models.Model):
    django_key = models.CharField(max_length=500, blank=True, null=True)
    time = models.DateTimeField(blank=True, null=True)
    device = models.CharField(max_length=100, blank=True, null=True)
    os = models.CharField(max_length=100, blank=True, null=True)
    browser = models.CharField(max_length=100, blank=True, null=True)
    user_agent = models.CharField(max_length=500, blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'deepmapdraw\".\"sessions'

class Sets(models.Model):
    session = models.ForeignKey(Sessions, models.DO_NOTHING, db_column='session', blank=True, null=True)
    start = models.DateTimeField(blank=True, null=True)
    end = models.DateTimeField(blank=True, null=True)
    basemap = models.CharField(max_length=100, blank=True, null=True)
    basemapimage = models.TextField(blank=True, null=True)
    zoom = models.IntegerField(blank=True, null=True)
    center_x = models.DecimalField(max_digits=19, decimal_places=10, blank=True, null=True)
    center_y = models.DecimalField(max_digits=19, decimal_places=10, blank=True, null=True)
    x_min = models.DecimalField(max_digits=19, decimal_places=10, blank=True, null=True)
    x_max = models.DecimalField(max_digits=19, decimal_places=10, blank=True, null=True)
    y_min = models.DecimalField(max_digits=19, decimal_places=10, blank=True, null=True)
    y_max = models.DecimalField(max_digits=19, decimal_places=10, blank=True, null=True)
    screen_width = models.IntegerField(blank=True, null=True)
    screen_height = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'deepmapdraw\".\"sets'

class Layers(models.Model):
    set = models.ForeignKey(Sets, models.DO_NOTHING, db_column='set', blank=True, null=True)
    start = models.DateTimeField(blank=True, null=True)
    end = models.DateTimeField(blank=True, null=True)
    layer = models.IntegerField(blank=True, null=True)
    number = models.IntegerField(blank=True, null=True)
    name = models.CharField(max_length=1000, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    geom = models.MultiPolygonField(srid=3857, null=True)
    class Meta:
        managed = True
        db_table = 'deepmapdraw\".\"layers'