-- ==============================================================================
-- LIBLOG: SUPABASE POSTGRESQL SCHEMA v1.0
-- Target: Calauan Community College (CCC)
-- ==============================================================================

-- 0. CLEANUP (Wipe existing MVP tables to prevent conflicts)
DROP TABLE IF EXISTS public.admin_actions CASCADE;
DROP TABLE IF EXISTS public.borrow_records CASCADE;
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.book_loans CASCADE;
DROP TABLE IF EXISTS public.library_logs CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;
DROP TABLE IF EXISTS public.patrons CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.resource_status CASCADE;
DROP TYPE IF EXISTS public.borrow_status CASCADE;

-- 1. ENUMS (Strict Type Definitions)
CREATE TYPE public.user_role AS ENUM ('STUDENT', 'FACULTY', 'VISITOR', 'LIBRARIAN');
CREATE TYPE public.resource_status AS ENUM ('AVAILABLE', 'BORROWED', 'DONATED', 'MAINTENANCE');
CREATE TYPE public.borrow_status AS ENUM ('ACTIVE', 'RETURNED', 'OVERDUE');

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

-- PATRONS (Users)
CREATE TABLE public.patrons (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    university_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role public.user_role DEFAULT 'STUDENT' NOT NULL,
    program VARCHAR(100), -- e.g., 'BSPA', 'Midwifery'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RESOURCES (Catalog)
CREATE TABLE public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50),
    category VARCHAR(100) NOT NULL,
    total_copies INT DEFAULT 1 NOT NULL,
    available_copies INT DEFAULT 1 NOT NULL,
    status public.resource_status DEFAULT 'AVAILABLE' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_copies CHECK (available_copies >= 0 AND available_copies <= total_copies)
);

-- ATTENDANCE LOGS (QR Scans)
CREATE TABLE public.attendance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patron_id UUID REFERENCES public.patrons(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    time_in TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    time_out TIMESTAMPTZ, -- Nullable until they scan out
    duration_minutes INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- BORROW RECORDS (Active Loans & Fines)
CREATE TABLE public.borrow_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patron_id UUID REFERENCES public.patrons(id) ON DELETE RESTRICT NOT NULL,
    resource_id UUID REFERENCES public.resources(id) ON DELETE RESTRICT NOT NULL,
    borrow_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ,
    status public.borrow_status DEFAULT 'ACTIVE' NOT NULL,
    paid_fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ADMIN ACTIONS (Audit Trail)
CREATE TABLE public.admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    librarian_id UUID REFERENCES public.patrons(id) NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- e.g., 'MANUAL_RETURN', 'WAIVE_FINE', 'UPDATE_STOCK'
    target_record_id UUID NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 3. DYNAMIC FINE CALCULATION (PostgreSQL Function)
-- ==============================================================================

-- This function calculates the ₱5.00/day fine in real-time.
-- It avoids storing a static "fine" column that goes out of date every 24 hours.
CREATE OR REPLACE FUNCTION public.calculate_current_fine(record_row public.borrow_records)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    days_late INT;
    fine_amount DECIMAL(10,2) := 0.00;
    end_date TIMESTAMPTZ;
BEGIN
    -- If returned, calculate up to the return date. Otherwise, calculate to NOW().
    end_date := COALESCE(record_row.return_date, NOW());
    
    IF end_date > record_row.due_date THEN
        days_late := EXTRACT(DAY FROM (end_date - record_row.due_date));
        IF days_late > 0 THEN
            fine_amount := days_late * 5.00;
        END IF;
    END IF;
    
    RETURN fine_amount - record_row.paid_fine_amount;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.patrons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- PATRONS: Users can read their own profile. Librarians can read all.
CREATE POLICY "Patrons can view own profile" 
    ON public.patrons FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Librarians can view all patrons" 
    ON public.patrons FOR ALL USING (
        EXISTS (SELECT 1 FROM public.patrons WHERE id = auth.uid() AND role = 'LIBRARIAN')
    );

-- RESOURCES: Everyone can view resources (except donated ones). Librarians can manage all.
CREATE POLICY "Public can view active resources" 
    ON public.resources FOR SELECT USING (status != 'DONATED');
CREATE POLICY "Librarians can manage resources" 
    ON public.resources FOR ALL USING (
        EXISTS (SELECT 1 FROM public.patrons WHERE id = auth.uid() AND role = 'LIBRARIAN')
    );

-- BORROW RECORDS: Users see their own. Librarians manage all.
CREATE POLICY "Patrons view own borrow records" 
    ON public.borrow_records FOR SELECT USING (auth.uid() = patron_id);
CREATE POLICY "Librarians manage borrow records" 
    ON public.borrow_records FOR ALL USING (
        EXISTS (SELECT 1 FROM public.patrons WHERE id = auth.uid() AND role = 'LIBRARIAN')
    );
