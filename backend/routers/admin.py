from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..auth import (
    create_access_token,
    get_current_admin,
    get_password_hash,
    verify_password,
)
from ..database import get_db
from ..models import Admin
from ..schemas import AdminLogin, AdminRegister, AdminResponse, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["Admin Authentication"])

@router.get("/status")
def check_auth_setup(db: Session = Depends(get_db)):
    """Check if any admin account has been configured in the database."""
    admin_count = db.query(Admin).count()
    return {"configured": admin_count > 0, "admin_count": admin_count}

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_admin(admin_in: AdminRegister, db: Session = Depends(get_db)):
    """
    Registers an administrator account using bcrypt password hashing.
    Generates and returns custom JWT access token.
    """
    existing_admin = db.query(Admin).filter(Admin.email == admin_in.email.strip().lower()).first()
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An admin with this email is already registered."
        )

    hashed_pw = get_password_hash(admin_in.password)
    new_admin = Admin(
        email=admin_in.email.strip().lower(),
        hashed_password=hashed_pw,
        full_name=admin_in.full_name.strip()
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    access_token = create_access_token(data={"sub": str(new_admin.id), "email": new_admin.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": new_admin
    }

@router.post("/login", response_model=TokenResponse)
def login_admin(credentials: AdminLogin, db: Session = Depends(get_db)):
    """
    Authenticates admin credentials against stored bcrypt hash.
    Generates custom signed JWT (Supabase Auth is prohibited per assessment).
    """
    admin = db.query(Admin).filter(Admin.email == credentials.email.strip().lower()).first()
    if not admin or not verify_password(credentials.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password combination",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(admin.id), "email": admin.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": admin
    }

@router.get("/me", response_model=AdminResponse)
def get_current_admin_profile(current_admin: Admin = Depends(get_current_admin)):
    """Protected Route: Validates custom JWT and returns current authenticated admin."""
    return current_admin
