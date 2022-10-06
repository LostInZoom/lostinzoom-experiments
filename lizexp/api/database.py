from django.db import connections

def execute_query(schema, query):
    with connections[schema].cursor() as cursor:
        cursor.execute(query)
        return {
            'cols': [desc[0] for desc in cursor.description],
            'rows': cursor.fetchall()
        }