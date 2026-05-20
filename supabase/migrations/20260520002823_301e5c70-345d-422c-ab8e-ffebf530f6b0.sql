-- Table for recruitment tokens
CREATE TABLE public.recruitment_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER DEFAULT NULL -- NULL means unlimited
);

-- Enable RLS
ALTER TABLE public.recruitment_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Recruiters can manage their own tokens"
ON public.recruitment_tokens
FOR ALL
USING (auth.uid() = recruiter_id);

CREATE POLICY "Anyone can check if a token is valid"
ON public.recruitment_tokens
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Add recruiter_id to profiles to link colaborador to recruiter
ALTER TABLE public.profiles ADD COLUMN recruiter_id UUID REFERENCES auth.users(id);

-- Function to generate a random token
CREATE OR REPLACE FUNCTION public.generate_token(length INT DEFAULT 6)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Omit confusing chars like 0, O, 1, I
  result TEXT := '';
  i INT := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
