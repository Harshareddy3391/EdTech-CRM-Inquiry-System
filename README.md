# EdTech CRM & Public Inquiry System

A full-stack inquiry intake and lead management CRM system for EdTech institutions. Built according to the Full-Stack Assessment Task specifications.

![EdTech CRM Banner](https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80)

---

## 🚀 Key Highlights & Architectural Compliance

1. **Public Inquiry Form**:
   - Clean, accessible, responsive form with field validation.
   - User Type dropdown: `Parent`, `Student`, `School`.
   - Category dropdown: `Scholarship`, `Concert`, `Admission`, `General Query`.
   - Personal Details: Full Name, Email, Phone Number.
   - Message / Query: Multi-line text area.
   - Data persists directly to **Supabase PostgreSQL** database.

2. **Custom JWT-Based Authentication (Strict Assessment Requirement)**:
   - **No Supabase Auth used**: Custom authentication implemented from scratch in the backend.
   - Password hashing with **bcrypt** (`passlib[bcrypt]`).
   - Signed JWT token generation and validation with HS256 (`python-jose`).
   - Route protection middleware verifying token signature and expiration on all CRM operations.

3. **Admin CRM Dashboard**:
   - Protected dashboard route accessible only to authenticated admins.
   - Tabular view with: **Name, Phone, Email, User Type, Category, Date, Status, and Workflow Actions**.
   - Mandatory Filters & Search:
     - Filter by **Category** (`Scholarship`, `Concert`, `Admission`, `General Query`)
     - Filter by **User Type** (`Parent`, `Student`, `School`)
     - Filter by **Status** (`New`, `In Review`, `Contacted`, `Resolved`)
     - Search bar matching **Name** or **Phone number** in real time.
   - Status updates, inquiry detail inspection, and CSV export.

---

## 🛠️ Tech Stack & Directory Structure

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Pydantic, Uvicorn.
- **Database**: Supabase (PostgreSQL 14+) with relational schema, enums, triggers, and B-tree indexes.
- **Security**: Custom JWT (HS256) + Bcrypt password hashing.

```text
├── backend/
│   ├── main.py              # FastAPI application entry & CORS middleware
│   ├── database.py          # SQLAlchemy engine & Supabase connection pool
│   ├── models.py            # PostgreSQL ORM models (Inquiry, Admin)
│   ├── schemas.py           # Pydantic request/response validation schemas
│   ├── auth.py              # Custom JWT generation, bcrypt hashing & auth middleware
│   ├── requirements.txt     # Python backend dependencies
│   └── routers/
│       ├── inquiries.py     # Public inquiry submit & protected admin triage endpoints
│       └── admin.py         # Admin login, registration, and profile endpoints
├── src/
│   ├── components/          # React UI components (Form, Dashboard, Navbar, Modals)
│   ├── services/            # Storage engine, custom JWT client simulator, Supabase hook
│   ├── types/               # TypeScript interfaces matching database schema
│   ├── App.tsx              # Main application router
│   └── main.tsx             # React DOM entry point
├── schema.sql               # PostgreSQL DDL script with tables, enums, indexes, and trigger
├── requirements.txt         # Root Python requirements file
├── .env.example             # Template for database credentials and JWT secret
└── README.md                # Comprehensive documentation
```

---

## 📦 Quick Start Guide (Local Setup)

### 1. Database Provisioning (Supabase)

1. Create a new project at [Supabase](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste the contents of `schema.sql` and run the script. This creates:
   - `user_type_enum`, `category_enum`, `inquiry_status_enum`
   - `inquiries` and `admins` tables
   - Multi-column indexes for search and filtering
   - Auto-updating `updated_at` trigger
4. Retrieve your PostgreSQL connection string from **Project Settings > Database > Connection String** (URI mode).

### 2. Backend Setup (FastAPI)

```bash
# Navigate to project root or backend
cd backend

# Create and activate a Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp ../.env.example .env
# Edit .env with your Supabase DATABASE_URL and a secret key

# Run the FastAPI development server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive OpenAPI documentation will be available at:
`http://localhost:8000/docs`

### 3. Frontend Setup (React)

```bash
# In the project root
npm install

# Start the Vite development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🔐 How to Test Custom JWT Authentication

The backend implements custom JWT authentication independently from Supabase Auth. Follow these steps to verify:

### 1. Register the Initial Admin

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Admissions Director",
    "email": "admin@edtech.com",
    "password": "SecurePassword123!"
  }'
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "admin": {
    "id": "7f9a2e1d-4c3b-4a5e-8f9d-1a2b3c4d5e6f",
    "email": "admin@edtech.com",
    "full_name": "Admissions Director"
  }
}
```

### 2. Admin Login

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edtech.com",
    "password": "SecurePassword123!"
  }'
```

### 3. Access Protected Inquiries Route (with JWT Bearer Token)

```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1 or 2
curl -X GET "http://localhost:8000/api/inquiries?category=Scholarship&user_type=Parent&search=Sharma" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

If the token is missing, invalid, or expired, the backend returns:
```json
{
  "detail": "Could not validate credentials or token expired"
}
```
with an HTTP `401 Unauthorized` status.

---

## 📡 API Reference Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/inquiries` | **Public** | Submit public inquiry (Parent, Student, School) |
| `POST` | `/api/auth/register` | **Public** | Register initial administrator with bcrypt password |
| `POST` | `/api/auth/login` | **Public** | Authenticate admin, returns custom signed JWT |
| `GET` | `/api/auth/me` | **Admin (JWT)** | Verify token and retrieve current admin details |
| `GET` | `/api/inquiries` | **Admin (JWT)** | List inquiries with filters (category, user_type, status) and search |
| `GET` | `/api/inquiries/{id}` | **Admin (JWT)** | Retrieve specific inquiry details |
| `PATCH`| `/api/inquiries/{id}/status`| **Admin (JWT)** | Update inquiry status (`New`, `In Review`, `Contacted`, `Resolved`) |

---

## 🧪 Interactive In-Browser Live Demo

The running application includes:
- **Public Inquiry Submission**: Test submissions with instant validation.
- **Admin Setup & Login**: Create your admin account or log in with custom JWT validation.
- **Search & Filter Matrix**: Filter by User Type, Category, and Status, or search by applicant name / phone.
- **Code Explorer**: Direct in-app inspection of `schema.sql`, `backend/main.py`, `backend/auth.py`, `.env.example`, and `requirements.txt`.
- **Supabase Connection Panel**: Switch between the integrated database engine and your live Supabase credentials.
