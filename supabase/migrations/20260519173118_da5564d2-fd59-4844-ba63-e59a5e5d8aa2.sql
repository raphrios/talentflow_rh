-- Fix function search path
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- Refine assessment insert policy
DROP POLICY IF EXISTS "Anyone can insert assessment" ON public.assessments;
CREATE POLICY "Anyone can insert assessment" 
ON public.assessments FOR INSERT 
TO anon, authenticated
WITH CHECK (candidate_id IS NOT NULL);

-- Refine documents insert policy
DROP POLICY IF EXISTS "Anyone can insert documents" ON public.documents;
CREATE POLICY "Anyone can insert documents" 
ON public.documents FOR INSERT 
TO anon, authenticated
WITH CHECK (candidate_id IS NOT NULL);

-- Refine storage upload policy
DROP POLICY IF EXISTS "Candidates and recruiters can upload documents" ON storage.objects;
CREATE POLICY "Candidates and recruiters can upload documents"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'candidate-docs' AND name IS NOT NULL);
