from django.db import connections

def clean_tables(schema, *tables):
    with connections[schema].cursor() as cursor:
        for table in tables:
            t = "delete from %s.%s" % (schema, table)
            s = "alter sequence %s.%s_id_seq restart with 1" % (schema, table)
            cursor.execute(t)
            cursor.execute(s)