-- Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'recruiter';

-- Ensure candidates has phone
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS phone TEXT;

-- Ensure documents has candidate_id correctly
-- (Assuming it already has it based on read_query)

-- Create a policy for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, CASE WHEN new.email = 'igorrafaeljunior@gmail.com' THEN 'admin' ELSE 'recruiter' END);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Policy for candidates
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruiters can see all candidates" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Recruiters can insert candidates" ON public.candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Recruiters can update candidates" ON public.candidates FOR UPDATE USING (true);

-- Storage for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('candidate-docs', 'candidate-docs', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access for candidate docs" ON storage.objects FOR SELECT USING (bucket_id = 'candidate-docs');
CREATE POLICY "Candidate upload docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'candidate-docs');
