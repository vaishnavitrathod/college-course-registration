import os
import mysql.connector
from flask import g
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

def get_db_connection(include_db=True):
    """
    Establishes a connection to the MySQL database.
    If include_db is False, connects to the server without selecting a specific database.
    """
    config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', 'Satoru@'),
    }
    if include_db:
        config['database'] = os.getenv('DB_NAME', 'college_course_reg')
        
    return mysql.connector.connect(**config)

def get_db():
    """
    Retrieves or establishes the database connection for the current Flask request context.
    Returns:
        (connection, cursor)
    """
    if 'db' not in g:
        g.db = get_db_connection()
        # dictionary=True returns rows as dicts (e.g. {'student_id': 1, 'name': 'John'})
        g.cursor = g.db.cursor(dictionary=True)
    return g.db, g.cursor

def close_db(e=None):
    """
    Closes the database connection at the end of the Flask request.
    """
    cursor = g.pop('cursor', None)
    db = g.pop('db', None)
    
    if cursor is not None:
        try:
            cursor.close()
        except Exception:
            pass
            
    if db is not None:
        try:
            db.close()
        except Exception:
            pass
