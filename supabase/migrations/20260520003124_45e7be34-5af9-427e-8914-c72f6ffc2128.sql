-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create collaborator_tests table
CREATE TABLE IF NOT EXISTS public.collaborator_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL, -- 'disc', 'big_five'
  responses JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collaborator_tests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own tests"
  ON public.collaborator_tests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tests"
  ON public.collaborator_tests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tests"
  ON public.collaborator_tests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Update trigger
DROP TRIGGER IF EXISTS update_collaborator_tests_updated_at ON public.collaborator_tests;
CREATE TRIGGER update_collaborator_tests_updated_at
BEFORE UPDATE ON public.collaborator_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();