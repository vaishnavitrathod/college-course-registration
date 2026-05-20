import os
import mysql.connector
from flask import g
from dotenv import load_dotenv

# Load .env relative to the project root directory (parent of backend/)
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path, override=True)

def get_db_connection(include_db=True):
    config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
    }
    
    ssl_ca = os.getenv('DB_SSL_CA')
    if ssl_ca and os.path.exists(ssl_ca):
        config['ssl_ca'] = ssl_ca
        config['ssl_verify_cert'] = True
    else:
        config['ssl_verify_cert'] = False

    if include_db:
        config['database'] = os.getenv('DB_NAME', 'defaultdb')

    return mysql.connector.connect(**config)

def get_db():
    if 'db' not in g:
        g.db = get_db_connection()
        g.cursor = g.db.cursor(dictionary=True)
    return g.db, g.cursor

def close_db(e=None):
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