-- Remove foreign key constraint from candidates before dropping jobs
ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_job_id_fkey;
ALTER TABLE public.candidates DROP COLUMN IF EXISTS job_id;

-- Clean up old tables
DROP TABLE IF EXISTS public.test_results;
DROP TABLE IF EXISTS public.admissions;
DROP TABLE IF EXISTS public.jobs;

-- Update candidates table
-- Using conditional renames to avoid errors if already renamed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='full_name') THEN
    ALTER TABLE public.candidates RENAME COLUMN full_name TO name;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='role_applied_for') THEN
    ALTER TABLE public.candidates RENAME COLUMN role_applied_for TO position;
  END IF;
END $$;

ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS token TEXT;
-- Add unique constraint to token if it doesn't have one
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidates_token_key') THEN
    ALTER TABLE public.candidates ADD CONSTRAINT candidates_token_key UNIQUE (token);
  END IF;
END $$;

-- Create assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  disc_scores JSONB,
  big_five_scores JSONB,
  dominant_trait TEXT,
  compatibility_score INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create processes table
CREATE TABLE IF NOT EXISTS public.processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Aguardando',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'Agendada',
  format TEXT DEFAULT 'Google Meet',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'Pendente',
  url TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to read candidates" ON public.candidates;
  CREATE POLICY "Allow authenticated users to read candidates" ON public.candidates FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to insert candidates" ON public.candidates;
  CREATE POLICY "Allow authenticated users to insert candidates" ON public.candidates FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to update candidates" ON public.candidates;
  CREATE POLICY "Allow authenticated users to update candidates" ON public.candidates FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow public read by token" ON public.candidates;
  CREATE POLICY "Allow public read by token" ON public.candidates FOR SELECT TO anon USING (true);
EXCEPTION WHEN others THEN NULL; END $$;

-- Assessments policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to read assessments" ON public.assessments;
  CREATE POLICY "Allow authenticated users to read assessments" ON public.assessments FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow public to insert assessments" ON public.assessments;
  CREATE POLICY "Allow public to insert assessments" ON public.assessments FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN others THEN NULL; END $$;

-- Processes, Meetings, Documents (HR only)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to manage processes" ON public.processes;
  CREATE POLICY "Allow authenticated users to manage processes" ON public.processes FOR ALL TO authenticated USING (true);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to manage meetings" ON public.meetings;
  CREATE POLICY "Allow authenticated users to manage meetings" ON public.meetings FOR ALL TO authenticated USING (true);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to manage documents" ON public.documents;
  CREATE POLICY "Allow authenticated users to manage documents" ON public.documents FOR ALL TO authenticated USING (true);
EXCEPTION WHEN others THEN NULL; END $$;
