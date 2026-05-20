import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv(override=True)

config = {
    'host': os.getenv('DB_HOST'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
}

print("Base config (without SSL):", {k: (v if k != 'password' else '***') for k, v in config.items()})

# Test 1: ssl_ca + ssl_verify_cert=True (Original)
try:
    print("\nTest 1: ssl_ca + ssl_verify_cert=True...")
    cfg = config.copy()
    cfg['ssl_ca'] = os.getenv('DB_SSL_CA')
    cfg['ssl_verify_cert'] = True
    db = mysql.connector.connect(**cfg)
    print("Success!")
    db.close()
except Exception as e:
    print(f"Error: {e}")

# Test 2: ssl_ca + ssl_verify_cert=False
try:
    print("\nTest 2: ssl_ca + ssl_verify_cert=False...")
    cfg = config.copy()
    cfg['ssl_ca'] = os.getenv('DB_SSL_CA')
    cfg['ssl_verify_cert'] = False
    db = mysql.connector.connect(**cfg)
    print("Success!")
    db.close()
except Exception as e:
    print(f"Error: {e}")

# Test 3: No ssl_ca (SSL disabled)
try:
    print("\nTest 3: No ssl_ca...")
    cfg = config.copy()
    db = mysql.connector.connect(**cfg)
    print("Success!")
    db.close()
except Exception as e:
    print(f"Error: {e}")
