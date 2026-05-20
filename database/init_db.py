import os
import sys
from dotenv import load_dotenv

# Add parent directory to path so we can import from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.db_config import get_db_connection

def init_db():
    print("Connecting to MySQL server...")
    try:
        # Connect without specifying database to run creation script
        conn = get_db_connection(include_db=False)
        cursor = conn.cursor()
    except Exception as e:
        print(f"Error connecting to MySQL: {e}")
        print("Please check if your MySQL server is running and the credentials in .env are correct.")
        sys.exit(1)
        
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    if not os.path.exists(schema_path):
        print(f"Schema file not found at {schema_path}")
        sys.exit(1)
        
    print(f"Reading schema from {schema_path}...")
    with open(schema_path, 'r', encoding='utf-8') as f:
        sql_script = f.read()
        
    # Split queries by semicolon. Since the SQL file has clean queries, this will work.
    queries = sql_script.split(';')
    
    print("Executing database schema initialization...")
    for query in queries:
        clean_query = query.strip()
        if not clean_query:
            continue
        try:
            # We can execute the queries directly.
            cursor.execute(clean_query)
        except Exception as e:
            print(f"Error executing statement:\n{clean_query}\nError: {e}")
            conn.rollback()
            cursor.close()
            conn.close()
            sys.exit(1)
            
    conn.commit()
    cursor.close()
    conn.close()
    print("Database initialization completed successfully! All tables created and seed data inserted.")

if __name__ == '__main__':
    init_db()
