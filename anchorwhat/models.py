from django.contrib.gis.db import models

# Create your models here.

class Drawing(models.Model):
    trial = models.ForeignKey('Trials', models.DO_NOTHING, db_column='trial', blank=True, null=True)
    layer = models.IntegerField(blank=True, null=True)
    importance = models.IntegerField(blank=True, null=True)
    thickness = models.IntegerField(blank=True, null=True)
    buffer = models.IntegerField(blank=True, null=True)
    wkt = models.TextField()
    geom_line = models.LineStringField(srid=3857, null=True)
    geom_poly = models.PolygonField(srid=3857, null=True)
    class Meta:
        managed = True
        db_table = 'anchorwhat\".\"drawing'

class PageTime(models.Model):
    page_number = models.ForeignKey('Pages', models.DO_NOTHING, db_column='page_number', blank=True, null=True)
    session = models.ForeignKey('Sessions', models.DO_NOTHING, db_column='session', blank=True, null=True)
    duration_ms = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'anchorwhat\".\"page_time'

class Pages(models.Model):
    class Meta:
        managed = True
        db_table = 'anchorwhat\".\"pages'

class Questions(models.Model):
    page_number = models.ForeignKey('Pages', models.DO_NOTHING, db_column='page_number', blank=True, null=True)
    question = models.CharField(max_length=1000, blank=True, null=True)
    number = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'anchorwhat\".\"questions'

class Sessions(models.Model):
    django_key = models.CharField(max_length=500, blank=True, null=True)
    start = models.DateTimeField(blank=True, null=True)
    end = models.DateTimeField(blank=True, null=True)
    device = models.CharField(max_length=100, blank=True, null=True)
    os = models.CharField(max_length=100, blank=True, null=True)
    browser = models.CharField(max_length=100, blank=True, null=True)
    user_agent = models.CharField(max_length=500, blank=True, null=True)
    screen_width = models.IntegerField(blank=True, null=True)
    screen_height = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'anchorwhat\".\"sessions'

class Sets(models.Model):
    x = models.IntegerField(blank=True, null=True)
    y = models.IntegerField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    basemap = models.CharField(max_length=100, blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'anchorwhat\".\"sets'

class Survey(models.Model):
    session = models.ForeignKey(Sessions, models.DO_NOTHING, db_column='session', blank=True, null=True)
    question = models.ForeignKey(Questions, models.DO_NOTHING, db_column='question', blank=True, null=True)
    answer = models.CharField(max_length=1000, blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'anchorwhat\".\"survey'

class Trials(models.Model):
    session = models.ForeignKey(Sessions, models.DO_NOTHING, db_column='session', blank=True, null=True)
    set_id = models.ForeignKey(Sets, models.DO_NOTHING, db_column='set', blank=True, null=True)
    zoom = models.IntegerField(blank=True, null=True)
    start = models.DateTimeField(blank=True, null=True)
    end = models.DateTimeField(blank=True, null=True)
    duration_ms = models.FloatField(blank=True, null=True)
    layer1 = models.CharField(max_length=20000, blank=True, null=True)
    layer2 = models.CharField(max_length=20000, blank=True, null=True)
    layer3 = models.CharField(max_length=20000, blank=True, null=True)
    layer4 = models.CharField(max_length=20000, blank=True, null=True)
    layer5 = models.CharField(max_length=20000, blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'anchorwhat\".\"trials'