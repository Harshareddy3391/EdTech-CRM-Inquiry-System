-- =======================================================================
-- EdTech CRM & Inquiry System - Database Schema
-- Target Database: Supabase (PostgreSQL 14+)
-- =======================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up previous types if re-running (optional)
-- DROP TYPE IF EXISTS user_type_enum CASCADE;
-- DROP TYPE IF EXISTS category_enum CASCADE;
-- DROP TYPE IF EXISTS inquiry_status_enum CASCADE;

-- 1. Create Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
        CREATE TYPE user_type_enum AS ENUM ('Parent', 'Student', 'School');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_enum') THEN
        CREATE TYPE category_enum AS ENUM ('Scholarship', 'Concert', 'Admission', 'General Query');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_status_enum') THEN
        CREATE TYPE inquiry_status_enum AS ENUM ('New', 'In Review', 'Contacted', 'Resolved');
    END IF;
END $$;

-- 2. Create Inquiries Table
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

-- 3. Create Admins Table (Custom JWT Authentication - NOT Supabase Auth)
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. High-Performance Indexes for Admin Dashboard Filtering & Search
CREATE INDEX IF NOT EXISTS idx_inquiries_category ON inquiries (category);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_type ON inquiries (user_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_name ON inquiries (name);
CREATE INDEX IF NOT EXISTS idx_inquiries_phone ON inquiries (phone);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins (email);

-- 5. Trigger Function for updated_at Auto-Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Initial Seed Sample (Uncomment if evaluators want preloaded demo records)
-- INSERT INTO inquiries (name, email, phone, user_type, category, message, status)
-- VALUES 
--   ('Priya Sharma', 'priya.sharma@example.com', '+91 9876543210', 'Parent', 'Scholarship', 'Interested in applying for merit-based financial aid for Grade 11.', 'New'),
--   ('Alex Chen', 'alex.chen@school.edu', '+1 555-019-2834', 'School', 'Concert', 'Inquiring about hosting the regional youth orchestra concert at our auditorium.', 'In Review'),
--   ('Marcus Johnson', 'marcus.j@student.org', '+1 555-014-9921', 'Student', 'Admission', 'Need details about international student application deadlines for Fall 2026.', 'Contacted');
