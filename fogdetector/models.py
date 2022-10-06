from django.db import models

# Create your models here.

class PageTime(models.Model):
    page_number = models.ForeignKey('Pages', models.DO_NOTHING, db_column='page_number', blank=True, null=True)
    session = models.ForeignKey('Sessions', models.DO_NOTHING, db_column='session', blank=True, null=True)
    duration_ms = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'fogdetector\".\"page_time'

class Pages(models.Model):
    class Meta:
        managed = True
        db_table = 'fogdetector\".\"pages'

class Questions(models.Model):
    page_number = models.ForeignKey('Pages', models.DO_NOTHING, db_column='page_number', blank=True, null=True)
    question = models.CharField(max_length=1000, blank=True, null=True)
    number = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'fogdetector\".\"questions'

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
        db_table = 'fogdetector\".\"sessions'

class Sets(models.Model):
    training = models.BooleanField(blank=True, null=True)
    number = models.IntegerField(blank=True, null=True)
    guide = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'fogdetector\".\"sets'


class Survey(models.Model):
    session = models.ForeignKey(Sessions, models.DO_NOTHING, db_column='session', blank=True, null=True)
    question = models.ForeignKey(Questions, models.DO_NOTHING, db_column='question', blank=True, null=True)
    answer = models.CharField(max_length=1000, blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'fogdetector\".\"survey'

class Targets(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    scale = models.CharField(max_length=100, blank=True, null=True)
    type = models.CharField(max_length=100, blank=True, null=True)
    x = models.IntegerField(blank=True, null=True)
    y = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'fogdetector\".\"targets'

class Trials(models.Model):
    session = models.ForeignKey(Sessions, models.DO_NOTHING, db_column='session', blank=True, null=True)
    trial_options = models.ForeignKey('TrialsOptions', models.DO_NOTHING, db_column='trial_options', blank=True, null=True)
    trial_position = models.IntegerField(blank=True, null=True)
    start = models.DateTimeField(blank=True, null=True)
    end = models.DateTimeField(blank=True, null=True)
    duration_ms = models.FloatField(blank=True, null=True)
    click_time = models.FloatField(blank=True, null=True)
    distance_px = models.FloatField(blank=True, null=True)
    distance_m = models.FloatField(blank=True, null=True)
    target = models.ForeignKey(Targets, models.DO_NOTHING, db_column='target', blank=True, null=True)
    target_start_top = models.IntegerField(blank=True, null=True)
    target_start_right = models.IntegerField(blank=True, null=True)
    target_start_bottom = models.IntegerField(blank=True, null=True)
    target_start_left = models.IntegerField(blank=True, null=True)
    target_end_top = models.IntegerField(blank=True, null=True)
    target_end_right = models.IntegerField(blank=True, null=True)
    target_end_bottom = models.IntegerField(blank=True, null=True)
    target_end_left = models.IntegerField(blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'fogdetector\".\"trials'

class TrialsOptions(models.Model):
    set = models.ForeignKey(Sets, models.DO_NOTHING, db_column='set', blank=True, null=True)
    type = models.CharField(max_length=100, blank=True, null=True)
    subtype = models.CharField(max_length=100, blank=True, null=True)
    basemap = models.CharField(max_length=100, blank=True, null=True)
    options = models.CharField(max_length=100, blank=True, null=True)
    scale = models.CharField(max_length=100, blank=True, null=True)
    class Meta:
        managed = True
        db_table = 'fogdetector\".\"trials_options'