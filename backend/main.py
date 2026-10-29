import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
#from .database import Base, engine
from .routers import admin, inquiries
from .database import Base, engine

load_dotenv()

# Initialize tables if not already present
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: could not auto-create tables on startup: {e}")

app = FastAPI(
    title="EdTech CRM & Inquiry System API",
    description="Full-stack educational inquiry capture with custom JWT admin authentication and Supabase PostgreSQL integration.",
    version="1.0.0"
)

# CORS configuration
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]
origins.extend(["*", "http://localhost:3000", "http://127.0.0.1:3000"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local development and cloud preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(inquiries.router)
app.include_router(admin.router)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "EdTech CRM & Inquiry API",
        "auth_provider": "Custom JWT (bcrypt + python-jose)",
        "database": "Supabase PostgreSQL",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
