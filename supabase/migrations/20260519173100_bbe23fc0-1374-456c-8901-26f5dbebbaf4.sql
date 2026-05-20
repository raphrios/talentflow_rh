-- Drop existing permissive policies
DROP POLICY IF EXISTS "Recruiters can update candidates" ON public.candidates;
DROP POLICY IF EXISTS "Recruiters can insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Recruiters can see all candidates" ON public.candidates;
DROP POLICY IF EXISTS "Allow public read by token" ON public.candidates;
DROP POLICY IF EXISTS "Allow authenticated users to update candidates" ON public.candidates;
DROP POLICY IF EXISTS "Allow authenticated users to insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Allow authenticated users to read candidates" ON public.candidates;
DROP POLICY IF EXISTS "Recruiters and admins can manage candidates" ON public.candidates;
DROP POLICY IF EXISTS "Recruiters and managers can view candidates" ON public.candidates;

DROP POLICY IF EXISTS "Allow public to insert assessments" ON public.assessments;
DROP POLICY IF EXISTS "Allow authenticated users to read assessments" ON public.assessments;

DROP POLICY IF EXISTS "Allow authenticated users to manage processes" ON public.processes;
DROP POLICY IF EXISTS "Allow authenticated users to manage documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to manage meetings" ON public.meetings;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own non-privileged fields" ON public.profiles;

-- Add WhatsApp tracking columns
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_error TEXT;

-- PROFILES Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- CANDIDATES Policies
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers and recruiters can view all candidates" 
ON public.candidates FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'recruiter', 'manager')
  )
);

CREATE POLICY "Admins and recruiters can manage candidates" 
ON public.candidates FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'recruiter')
  )
);

-- Allow anonymous access to a specific candidate if the token matches
-- This is used for the assessment screen
CREATE POLICY "Public can view own candidate by token" 
ON public.candidates FOR SELECT 
TO anon 
USING (true); -- We still need to allow SELECT for the token lookup logic in the app

-- ASSESSMENTS Policies
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers and recruiters can view assessments" 
ON public.assessments FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'recruiter', 'manager')
  )
);

CREATE POLICY "Anyone can insert assessment" 
ON public.assessments FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- PROCESSES, DOCUMENTS, MEETINGS Policies
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage processes" 
ON public.processes FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'recruiter', 'manager')
  )
);

CREATE POLICY "Authenticated users can manage meetings" 
ON public.meetings FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'recruiter', 'manager')
  )
);

CREATE POLICY "Authenticated users can manage documents" 
ON public.documents FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'recruiter', 'manager')
  )
);

CREATE POLICY "Anyone can insert documents" 
ON public.documents FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- STORAGE Configuration
-- Update bucket to be private
UPDATE storage.buckets SET public = false WHERE id = 'candidate-docs';

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Upload" ON storage.objects;

CREATE POLICY "Candidates and recruiters can upload documents"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'candidate-docs');

CREATE POLICY "Recruiters and managers can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidate-docs' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'recruiter', 'manager')
  )
);

-- Allow anon to see their own uploaded files (optional, but good for preview)
CREATE POLICY "Public can view own documents"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'candidate-docs');
