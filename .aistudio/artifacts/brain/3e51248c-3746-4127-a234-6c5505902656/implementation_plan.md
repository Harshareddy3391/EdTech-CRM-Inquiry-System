# EdTech CRM & Public Inquiry System

A clean, production-grade full-stack inquiry intake and CRM system for an educational platform, enabling public visitors to submit categorized inquiries and authenticated administrators to manage, filter, search, and update inquiry statuses.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your selections and latest request:
> - **Backend Architecture**: Standalone, clean Python FastAPI codebase in `/backend` (equipped with custom JWT authentication from scratch using bcrypt and pyjwt, SQLAlchemy database models, and Pydantic schemas) paired with a responsive frontend client equipped with an in-browser relational mock engine and live Supabase config switcher.
> - **Requirements File Added**: Dedicated `requirements.txt` (both at root level and within `/backend/requirements.txt`) containing all dependencies (`fastapi`, `uvicorn[standard]`, `sqlalchemy`, `psycopg2-binary`, `python-jose[cryptography]`, `passlib[bcrypt]`, `pydantic`, `python-multipart`) for single-step `pip install -r requirements.txt` setup.
> - **Database Strategy**: Clean PostgreSQL tables generated according to `schema.sql` with Supabase support via connection configuration, initially initialized empty as requested.
> - **Initial Data State**: Starts with an empty database, providing a first-time administrator account creation flow (`/admin/register` or initial setup trigger) and quick-fill inquiry test actions.
> - **Complete Assessment Deliverables**: Codebase organized with `schema.sql`, `.env.example`, `requirements.txt`, `README.md`, standalone `/backend` directory, and full interactive frontend preview.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Public Inquiry Portal**: Responsive, accessible inquiry submission interface for parents, students, and schools to submit queries across scholarship, concert, admission, and general query categories.
  2. **Admin Authentication**: Custom JWT-based authentication from scratch (no Supabase Auth or third-party auth services), enforcing bcrypt password hashing and token expiration.
  3. **Protected CRM Dashboard**: High-density, tabular inquiry administration console featuring real-time search (by name or phone), multi-criteria dropdown filtering (by user type, category, status), inquiry status tracking (New, In Review, Contacted, Resolved), and notes/details modal.
  4. **Assessment Artifacts**: Exportable `schema.sql`, `.env.example`, `requirements.txt`, and step-by-step `README.md` for local FastAPI and React development.
- **Target Audience / Persona**:
  - Prospective Students, Parents, and Partner Schools submitting inquiries.
  - EdTech Admissions and Support Staff managing inbound leads and response workflows.
- **Key Value**: Streamlines educational inquiry capture with strict data validation, role isolation, and instant administrative lead triage.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Public Intake Flow**:
   - Visitor arrives on `/` landing or toggle to the public form.
   - Clean, modern single-column form with card-free spatial structure:
     - User Type: `Parent` | `Student` | `School`
     - Category: `Scholarship` | `Concert` | `Admission` | `General Query`
     - Personal Details: Full Name, Email, Phone Number (with live formatting & validation)
     - Message / Query: Multi-line text area with character counter
   - Form submission validates input, displays instant feedback, and clears with a success banner.

2. **Admin Login & Setup Flow**:
   - Visitor navigates to `/admin` or clicks "Admin Portal" in top bar.
   - If no admin exists yet (clean database state), presents a streamlined initial "Setup Admin Account" form.
   - When configured, presents email/password login using custom JWT auth.
   - Upon successful credential check, JWT access token is stored securely in session storage, unlocking the protected dashboard.

3. **Inquiry Management Flow (Protected CRM Dashboard)**:
   - Header with active admin badge, Supabase status indicator, and logout action.
   - KPI metric strip: Total Inquiries, Pending Review, In Progress, Resolved.
   - Multi-Filter Toolbar:
     - Category selector: All, Scholarship, Concert, Admission, General Query
     - User Type selector: All, Parent, Student, School
     - Status selector: All, New, In Review, Contacted, Resolved
     - Search Input: Real-time filtering by Name or Phone Number with clear button.
   - High-density Data Table:
     - Columns: Name, Phone, Email, User Type, Category, Date, Status, Actions.
     - Inline status dropdown to advance inquiry workflow.
     - Detail modal to view complete query message and administrative notes.
     - CSV export capability for assessment demonstration.

### Visual Identity & Theme
- **Aesthetic Direction**: Contemporary EdTech SaaS — minimal, utilitarian, typography-led with crisp hairline dividers and zero unnecessary skeuomorphism.
- **Palette**:
  - Neutral Canvas: Off-white / Cool slate (`#F8FAFC` to `#FFFFFF` light; `#0F172A` deep navy dark accents).
  - Primary Accent: Deep Indigo / Cobalt (`#3B82F6` / `#2563EB`) for focused states and primary actions.
  - Semantic Status:
    - New: Cool Slate / Blue (`#3B82F6`)
    - In Review: Amber / Ocre (`#D97706`)
    - Contacted: Purple / Violet (`#8B5CF6`)
    - Resolved: Emerald / Forest (`#16A34A`)
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` or modern geometric sans with `text-wrap: balance`.
  - Body: `DM Sans` / `Plus Jakarta Sans` for clean, readable form inputs.
  - Table Numerals & Timestamps: `tabular-nums font-mono` for vertical alignment.
- **Zero-Pill Discipline**:
  - Metadata in tables rendered as clean text with typographic separators (`·` or `/`).
  - Interactive status controls styled as clean segmented selectors or subtle dropdowns, avoiding garish candy pill badges.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Standalone FastAPI Backend + Client-Side Mock/Bridge**:
  - *Chosen Approach*: Deliver a complete, runnable Python FastAPI backend directory (`/backend`) with `main.py`, `database.py`, `models.py`, `schemas.py`, `auth.py`, `requirements.txt`, alongside a robust client-side storage bridge in the React frontend.
  - *Why*: Allows the live web preview to run instantly in the browser without server boot failures, while fulfilling 100% of the candidate assessment code requirements for Python FastAPI, custom JWT, and PostgreSQL schema.
- **Decision 2: Custom JWT Implementation (No Supabase Auth)**:
  - *Chosen Approach*: Implement custom JWT token generation, verification, and bcrypt password hashing from scratch in the Python backend (`auth.py` using `passlib[bcrypt]` and `python-jose`), with a matching client-side authentication validator for the live demo.
  - *Why*: Strictly satisfies the assessment constraint: *"Candidate must implement custom JWT-based authentication from scratch in their backend (password hashing using bcrypt, JWT generation, and protected routes middleware. Using Supabase Auth is not allowed for this assessment)"*.
- **Decision 3: Live Supabase Config Switcher**:
  - *Chosen Approach*: Provide a "Database Connection" drawer/modal where an evaluator can view the PostgreSQL connection schema, test connection parameters, or supply an active Supabase URL/key.
  - *Why*: Gives evaluators the flexibility to run the demo standalone or test against their live Supabase instance.
- **Decision 4: Explicit Python `requirements.txt` Dependency Management**:
  - *Chosen Approach*: Provide both a root-level `requirements.txt` and `/backend/requirements.txt` with locked versions for FastAPI, Uvicorn, SQLAlchemy, psycopg2-binary, passlib, python-jose, and python-multipart.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Public Web User                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Submits Inquiry
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        React Frontend App                              │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ Public Inquiry Intake │  │ Protected Admin CRM Dashboard          │ │
│  │ - User Type Dropdown  │  │ - Custom JWT Session Gate              │ │
│  │ - Category Dropdown   │  │ - Category & User-Type Filters         │ │
│  │ - Personal Info Form  │  │ - Search by Name / Phone Number        │ │
│  │ - Message Textarea    │  │ - Status Workflow Management           │ │
│  └───────────┬───────────┘  └───────────────────▲────────────────────┘ │
│              │                                  │                      │
│              └───────────────┬──────────────────┘                      │
│                              ▼                                         │
│               Inquiry Service & Persistence Layer                     │
│               - In-Memory / LocalStorage Engine                        │
│               - Optional Supabase Direct Client Hook                   │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Python FastAPI Backend Package (/backend)                  │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────────┐ │
│  │ routers/auth  │  │ routers/crm   │  │ core/security (JWT, Bcrypt) │ │
│  └───────┬───────┘  └───────┬───────┘  └──────────────┬──────────────┘ │
│          │                  │                         │                │
│          └──────────────────┴───────────┬─────────────┘                │
│                                         ▼                              │
│                            SQLAlchemy & Pydantic                       │
└─────────────────────────────────────────┬──────────────────────────────┘
                                          │ Standard Connection String
                                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL Database                        │
│                    - tables: inquiries, admins                         │
│                    - schema.sql (DDL + Indexes)                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Python Dependencies (`requirements.txt`)
```text
fastapi>=0.110.0,<0.116.0
uvicorn[standard]>=0.28.0,<0.35.0
sqlalchemy>=2.0.28,<2.1.0
psycopg2-binary>=2.9.9
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
bcrypt>=4.0.1,<4.2.0
pydantic>=2.6.4,<3.0.0
pydantic-settings>=2.2.1
python-multipart>=0.0.9
python-dotenv>=1.0.1
```

### Database Schema (`schema.sql`)

```sql
-- Create Enum Types
CREATE TYPE user_type_enum AS ENUM ('Parent', 'Student', 'School');
CREATE TYPE category_enum AS ENUM ('Scholarship', 'Concert', 'Admission', 'General Query');
CREATE TYPE inquiry_status_enum AS ENUM ('New', 'In Review', 'Contacted', 'Resolved');

-- Table: inquiries
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    user_type user_type_enum NOT NULL,
    category category_enum NOT NULL,
    message TEXT NOT NULL,
    status inquiry_status_enum NOT NULL DEFAULT 'New',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: admins
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Filter & Search Performance
CREATE INDEX IF NOT EXISTS idx_inquiries_category ON inquiries(category);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_type ON inquiries(user_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_name ON inquiries(name);
CREATE INDEX IF NOT EXISTS idx_inquiries_phone ON inquiries(phone);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
```

### Core API Endpoints (FastAPI Specification)

1. `POST /api/inquiries`: Public endpoint to create new inquiry.
2. `POST /api/auth/register`: Create initial admin (or registration with secret token).
3. `POST /api/auth/login`: Admin authentication returning `{ access_token, token_type }`.
4. `GET /api/auth/me`: Current admin verification (Protected route).
5. `GET /api/inquiries`: Admin list inquiries with query params `category`, `user_type`, `status`, `search` (Protected route).
6. `PATCH /api/inquiries/{id}/status`: Admin update inquiry status (Protected route).

---

## 5. Deliverables & Repository Structure

1. `/requirements.txt` & `/backend/requirements.txt`:
   - Exact Python packages required to run the FastAPI backend locally or deploy to Render/Railway.
2. `/backend`:
   - `main.py`: FastAPI application entry point, CORS middleware, route registration.
   - `database.py`: SQLAlchemy engine setup using Supabase PostgreSQL connection string.
   - `models.py`: SQLAlchemy ORM classes (`Inquiry`, `Admin`).
   - `schemas.py`: Pydantic request/response schemas with field validation.
   - `auth.py`: Bcrypt password hashing (`passlib`), JWT generation (`python-jose`), and `get_current_admin` OAuth2 dependency.
   - `routers/`: Modular route handlers for `/auth` and `/inquiries`.
3. `/schema.sql`: Clean PostgreSQL DDL file with tables, enums, triggers, and indexes.
4. `/.env.example`: Comprehensive environment template with Supabase DB URL, JWT secret key, and port settings.
5. `/README.md`: Professional documentation detailing setup, local run instructions, JWT verification, and API reference.
6. `/src`: Responsive React UI with public inquiry form, live admin CRM dashboard, filters, search, and Supabase config viewer.
