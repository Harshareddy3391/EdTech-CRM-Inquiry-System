import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Terminal, FileText, Database, Shield } from 'lucide-react';

interface CodeExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExplorerModal: React.FC<CodeExplorerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    'schema' | 'requirements' | 'env' | 'main' | 'auth' | 'inquiries_router' | 'readme'
  >('schema');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeSnippets: Record<string, { title: string; lang: string; code: string; icon: any }> = {
    schema: {
      title: 'schema.sql (PostgreSQL DDL & Indexes)',
      lang: 'sql',
      icon: Database,
      code: `-- =======================================================================
-- EdTech CRM & Inquiry System - Database Schema
-- Target Database: Supabase (PostgreSQL 14+)
-- =======================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
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

-- Table: admins (Custom JWT Authentication - NOT Supabase Auth)
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_category ON inquiries (category);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_type ON inquiries (user_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_name ON inquiries (name);
CREATE INDEX IF NOT EXISTS idx_inquiries_phone ON inquiries (phone);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins (email);`,
    },
    requirements: {
      title: 'requirements.txt (Python FastAPI Backend)',
      lang: 'text',
      icon: Terminal,
      code: `fastapi>=0.110.0,<0.116.0
uvicorn[standard]>=0.28.0,<0.35.0
sqlalchemy>=2.0.28,<2.1.0
psycopg2-binary>=2.9.9
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
bcrypt>=4.0.1,<4.2.0
pydantic>=2.6.4,<3.0.0
pydantic-settings>=2.2.1
python-multipart>=0.0.9
python-dotenv>=1.0.1`,
    },
    env: {
      title: '.env.example',
      lang: 'bash',
      icon: FileText,
      code: `# Supabase PostgreSQL Database Connection
DATABASE_URL="postgresql://postgres:your_password@db.your_project_ref.supabase.co:5432/postgres"

# Custom JWT Authentication Settings (DO NOT use Supabase Auth)
SECRET_KEY="supersecretjwtkeyforassessmentevaluationchangethisinproduction"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="1440"

# Server Configuration
BACKEND_HOST="0.0.0.0"
BACKEND_PORT="8000"
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"`,
    },
    auth: {
      title: 'backend/auth.py (Custom JWT & Bcrypt Middleware)',
      lang: 'python',
      icon: Shield,
      code: `import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .database import get_db
from .models import Admin

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "custom_jwt_secret_key_edtech_crm")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Admin:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: str = payload.get("sub")
        if not admin_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid signature")

    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin`,
    },
    inquiries_router: {
      title: 'backend/routers/inquiries.py (Filtered Endpoints)',
      lang: 'python',
      icon: FileCode,
      code: `@router.post("", response_model=InquiryResponse, status_code=status.HTTP_201_CREATED)
def submit_public_inquiry(inquiry_in: InquiryCreate, db: Session = Depends(get_db)):
    """Public Endpoint: Saves inquiry directly into Supabase PostgreSQL."""
    db_inquiry = Inquiry(
        name=inquiry_in.name.strip(),
        email=inquiry_in.email.strip().lower(),
        phone=inquiry_in.phone.strip(),
        user_type=inquiry_in.user_type,
        category=inquiry_in.category,
        message=inquiry_in.message.strip(),
        status="New"
    )
    db.add(db_inquiry)
    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry

@router.get("", response_model=List[InquiryResponse])
def list_inquiries_for_admin(
    category: Optional[CategoryEnum] = Query(None),
    user_type: Optional[UserTypeEnum] = Query(None),
    inquiry_status: Optional[InquiryStatusEnum] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Protected Admin Route: Multi-criteria filtering and text search."""
    query = db.query(Inquiry)
    if category:
        query = query.filter(Inquiry.category == category)
    if user_type:
        query = query.filter(Inquiry.user_type == user_type)
    if inquiry_status:
        query = query.filter(Inquiry.status == inquiry_status)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(Inquiry.name.ilike(term), Inquiry.phone.ilike(term)))
    return query.order_by(Inquiry.created_at.desc()).all()`,
    },
    main: {
      title: 'backend/main.py',
      lang: 'python',
      icon: Terminal,
      code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import admin, inquiries

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EdTech CRM & Inquiry System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inquiries.router)
app.include_router(admin.router)`,
    },
    readme: {
      title: 'README.md (Quick Start & JWT Instructions)',
      lang: 'markdown',
      icon: FileText,
      code: `# Run FastAPI Locally:
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload

# Test Custom JWT with cURL:
curl -X POST "http://localhost:8000/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@edtech.com","password":"AdminPassword123"}'

# Access Protected Route:
curl -X GET "http://localhost:8000/api/inquiries?category=Scholarship" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>"`,
    },
  };

  const currentSnippet = codeSnippets[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Assessment Deliverables & Source Code Explorer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-900 border-b border-slate-800 overflow-x-auto shrink-0 text-xs">
          {Object.entries(codeSnippets).map(([key, item]) => {
            const Icon = item.icon;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-blue-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{key === 'schema' ? 'schema.sql' : key === 'requirements' ? 'requirements.txt' : key === 'env' ? '.env.example' : key === 'auth' ? 'auth.py (JWT)' : key === 'inquiries_router' ? 'inquiries.py' : key === 'main' ? 'main.py' : 'README.md'}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content */}
        <div className="relative flex-1 p-4 overflow-y-auto bg-slate-950 font-mono text-xs leading-relaxed text-slate-300">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <span className="text-slate-400 font-sans text-xs">
              {currentSnippet.title}
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-sans font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre font-mono">
            <code>{currentSnippet.code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Files available directly in repository root and <code className="text-blue-400">/backend</code> folder</span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
