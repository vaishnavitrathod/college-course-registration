# College Course Registration System

A premium College Course Registration Portal designed for students to view course catalogs, search and filter subjects, manage course enrollments, and track academic credit limits in real-time.

Built with **MySQL** for relational data persistence, **Python (Flask)** for a robust RESTful API with transaction safety, and a premium **Single-Page-Application (SPA)** frontend built with vanilla HTML5, CSS3, and JavaScript.

---

## Technical Stack & Features
- **Database**: MySQL (relational schema, transactional integrity, FK cascading, check constraints).
- **Backend**: Python 3 & Flask (Session authentication, parameterized queries, and ACID transactional route logic).
- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphic dark design system with glowing backgrounds, custom HSL palette, responsive grids), Vanilla JavaScript (Asynchronous fetch logic, dynamic rendering, reactive summary metrics, animated custom toast system).
- **Security & Integrity**: 
  - Password hashing with PBKDF2 (`werkzeug.security`).
  - ACID transactions preventing double registration or over-booking full classes.
  - Automatic credit load constraints (maximum 18 credits per semester) verified at database and server layers.

---

## Directory Structure
```
college_course_registration/
│
├── backend/
│   ├── app.py             # Main Flask server & REST API
│   └── db_config.py       # Flask DB context connection provider
│
├── database/
│   ├── schema.sql         # Database tables DDL & seed data
│   └── init_db.py         # DB Setup Automation script
│
├── frontend/
│   ├── index.html         # SPA Structure
│   ├── css/
│   │   └── styles.css     # Premium styling
│   └── js/
│       └── app.js         # Fetch routines & UI binding
│
├── requirements.txt       # Python package dependencies
├── .env                   # Database and Flask secret keys configuration
└── test_api.py            # Automated API integration test suite
```

---

## Setup & Running Locally

### 1. Prerequisites
- **Python 3.8+** installed.
- **MySQL Server** (e.g. MySQL 8.0) installed and running.

### 2. Install Python Dependencies
Open your terminal in the project directory and run:
```bash
pip install -r requirements.txt
```

### 3. Database Credentials Configuration
Verify or edit the credentials in the `.env` file at the project root:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=college_course_reg
SECRET_KEY=some_unique_secret_string
```

### 4. Initialize Database
Initialize the database tables and populate the seed courses by executing:
```bash
python database/init_db.py
```
This will automatically connect to your MySQL instance, create the `college_course_reg` schema, create the tables (`students`, `courses`, `enrollments`), and populate courses from CS, Mathematics, Physics, and EE departments.

### 5. Run the Server
Launch the Flask development server:
```bash
python backend/app.py
```
By default, the application will start on **`http://127.0.0.1:5000`**. 

Open this address in your web browser to access the portal!

---

## Automated Verification
To run the automated suite testing authentication, double enrollments, transaction safety, seat limits, and credit-limit constraints, run:
```bash
python test_api.py
```
All tests should pass successfully.
