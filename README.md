# College Course Registration System

A premium College Course Registration Portal for students to browse course catalogs, manage enrollments, track academic credits, and plan their full B.Tech degree — all in real-time.

Built with **Aiven MySQL** for cloud-hosted relational data persistence, **Python (Flask)** for a robust RESTful API, and a premium **Single-Page-Application (SPA)** frontend with vanilla HTML5, CSS3, and JavaScript.

🌐 **Live Demo**: [college-course-registration-pkyf.onrender.com](https://college-course-registration-pkyf.onrender.com)

---

## Technical Stack & Features

- **Database**: Aiven MySQL (cloud-hosted, SSL-secured, relational schema with FK cascading and check constraints)
- **Backend**: Python 3 & Flask (session authentication, parameterized queries, ACID transactional route logic)
- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphic dark design system, custom HSL palette, responsive grids), Vanilla JavaScript (async fetch, dynamic rendering, animated toast system)
- **Deployment**: Render (backend) + Aiven (database)

### Key Features
- 🔐 Secure registration & login with password hashing (PBKDF2 via `werkzeug.security`)
- 📚 Full B.Tech Degree Planner across 8 semesters (CS, AI/ML, Civil, Mechanical)
- 🎓 Course catalog with department & semester filters
- ✅ Real-time enrollment with seat availability tracking
- ⏳ Automatic waitlist system with position tracking
- 💳 Credit load enforcement (max 20 credits per semester)
- 📊 Academic history, GPA calculator & official transcript
- 🤖 AI Academic Assistant chatbot
- 🌙 Dark/Light theme toggle
- 📄 Downloadable enrollment certificate

---

## Technical Architecture

- **Security & Integrity**:
  - Password hashing with PBKDF2 (`werkzeug.security`)
  - ACID transactions preventing double registration or overbooking
  - Credit load constraints (maximum 20 credits per semester) enforced at both server and database layers
  - SSL-secured Aiven MySQL connection via `ca.pem`

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
│   └── init_db.py         # DB setup automation script
│
├── frontend/
│   ├── index.html         # SPA structure
│   ├── css/
│   │   └── styles.css     # Premium styling
│   └── js/
│       └── app.js         # Fetch routines & UI binding
│
├── requirements.txt       # Python package dependencies
├── .env                   # Local environment config (not committed)
└── test_api.py            # Automated API integration test suite
```

---

## Setup & Running Locally

### 1. Prerequisites
- **Python 3.8+** installed
- **Aiven MySQL** account (or local MySQL 8.0)

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Create a `.env` file in the project root:
```env
DB_HOST=your-aiven-host.aivencloud.com
DB_PORT=your_port
DB_USER=avnadmin
DB_PASSWORD=your_aiven_password
DB_NAME=defaultdb
DB_SSL_CA=ca.pem
SECRET_KEY=your_secret_key
FLASK_ENV=development
FLASK_APP=backend/app.py
```

Download `ca.pem` from your Aiven console and place it in the project root.

### 4. Initialize Database
```bash
python database/init_db.py
```

### 5. Run the Server
```bash
cd backend
python app.py
```

Open **`http://127.0.0.1:5000`** in your browser.

---

## Deployment (Render + Aiven)

1. Push code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repository
4. Set start command: `python backend/app.py`
5. Add all environment variables in Render's dashboard
6. Deploy!

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new student |
| POST | `/api/auth/login` | Login with email & password |
| POST | `/api/auth/logout` | Logout current session |
| GET | `/api/auth/me` | Get current session user |
| GET | `/api/courses` | List all courses (with filters) |
| GET | `/api/enrollments/my-courses` | Get enrolled courses |
| POST | `/api/enrollments/register` | Register for a course |
| POST | `/api/enrollments/drop` | Drop a course |
| POST | `/api/waitlist/join` | Join course waitlist |
| POST | `/api/waitlist/leave` | Leave course waitlist |
| GET | `/api/waitlist/status` | Get waitlist positions |
| GET | `/api/student/history` | Get academic history & GPA |
| PUT | `/api/student/profile` | Update student profile |
| GET | `/api/degree-plan` | Get full B.Tech degree plan |
| GET | `/api/recommender/suggest` | Get AI course recommendations |
| POST | `/api/chatbot/query` | Chat with AI assistant |
| GET | `/api/student/certificate` | Download enrollment certificate |

---

## Automated Testing

```bash
python test_api.py
```

Tests cover authentication, double enrollment prevention, seat limits, credit constraints, and transaction safety.