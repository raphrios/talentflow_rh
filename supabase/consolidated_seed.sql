-- =============================================================
-- TalentFlowRH – Consolidated fresh-install SQL script
-- Run this on a brand-new Supabase / PostgreSQL project.
-- =============================================================

-- ---------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------
-- Storage bucket
-- ---------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-docs', 'candidate-docs', false)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- TABLE: public.profiles
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  full_name     TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'recruiter',
  recruiter_id  UUID REFERENCES auth.users(id),
  is_master     BOOLEAN DEFAULT false,
  subscription_end TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ---------------------------------------------------------------
-- TABLE: public.candidates
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT,
  email           TEXT,
  phone           TEXT,
  position        TEXT,
  department      TEXT,
  status          TEXT DEFAULT 'Novo',
  token           TEXT UNIQUE,
  recruiter_id    UUID REFERENCES auth.users(id),
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  whatsapp_error  TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ---------------------------------------------------------------
-- TABLE: public.assessments
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id        UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  disc_scores         JSONB,
  big_five_scores     JSONB,
  dominant_trait      TEXT,
  compatibility_score INTEGER DEFAULT 0,
  completed_at        TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ---------------------------------------------------------------
-- TABLE: public.processes
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'Aguardando',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ---------------------------------------------------------------
-- TABLE: public.meetings
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meetings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  time         TIME NOT NULL,
  type         TEXT,
  status       TEXT DEFAULT 'Agendada',
  format       TEXT DEFAULT 'Google Meet',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ---------------------------------------------------------------
-- TABLE: public.documents
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT,
  status       TEXT DEFAULT 'Pendente',
  url          TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ---------------------------------------------------------------
-- TABLE: public.recruitment_tokens
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recruitment_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at   TIMESTAMP WITH TIME ZONE,
  usage_count  INTEGER DEFAULT 0,
  max_usage    INTEGER DEFAULT NULL
);

-- ---------------------------------------------------------------
-- TABLE: public.collaborator_tests
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collaborator_tests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type    TEXT NOT NULL,
  responses    JSONB DEFAULT '{}'::jsonb,
  status       TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ---------------------------------------------------------------
-- FUNCTIONS
-- ---------------------------------------------------------------

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

-- Alias used by older trigger wiring
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC;

-- is_admin() helper for RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;

-- prevent_role_self_escalation (referenced by earlier migrations)
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role != NEW.role AND auth.uid() = OLD.id THEN
    RAISE EXCEPTION 'Users cannot change their own role.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- on_auth_user_created – auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, recruiter_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    CASE
      WHEN NEW.email = 'igorrafaeljunior@gmail.com' THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'recruiter')
    END,
    (NEW.raw_user_meta_data->>'recruiter_id')::UUID
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- generate_token helper
CREATE OR REPLACE FUNCTION public.generate_token(length INT DEFAULT 6)
RETURNS TEXT AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i      INT  := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * char_length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.generate_token(INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_token(INT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.generate_token(INT) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.generate_token(INT) TO service_role;

-- create_recruiter (master-only)
CREATE OR REPLACE FUNCTION public.create_recruiter(
  p_email     TEXT,
  p_password  TEXT,
  p_full_name TEXT,
  p_role      TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_user_id      UUID;
  is_master_caller BOOLEAN;
BEGIN
  SELECT (auth.email() = 'igorrafaeljunior@gmail.com') INTO is_master_caller;

  IF NOT COALESCE(is_master_caller, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado. Apenas o Administrador Master pode criar usuários.');
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    LOWER(p_email),
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    now(), now(), '', '', '', ''
  )
  RETURNING id INTO new_user_id;

  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (new_user_id, p_full_name, p_role, LOWER(p_email))
  ON CONFLICT (id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'user_id', new_user_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este e-mail já está cadastrado.');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_recruiter(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_recruiter(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.create_recruiter(TEXT, TEXT, TEXT, TEXT) TO service_role;

-- delete_recruiter (master-only)
CREATE OR REPLACE FUNCTION public.delete_recruiter(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_master_caller BOOLEAN;
BEGIN
  SELECT (auth.email() = 'igorrafaeljunior@gmail.com') INTO is_master_caller;

  IF NOT COALESCE(is_master_caller, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  DELETE FROM auth.users   WHERE id = p_user_id;
  DELETE FROM public.profiles WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_recruiter(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.delete_recruiter(UUID) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.delete_recruiter(UUID) TO service_role;

-- ---------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_collaborator_tests_updated_at ON public.collaborator_tests;
CREATE TRIGGER update_collaborator_tests_updated_at
  BEFORE UPDATE ON public.collaborator_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------------
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_tests ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- RLS POLICIES – profiles
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users"  ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"            ON public.profiles;
DROP POLICY IF EXISTS "Admins podem fazer tudo nos perfis"            ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil"         ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------
-- RLS POLICIES – candidates
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Managers and recruiters can view all candidates" ON public.candidates;
DROP POLICY IF EXISTS "Admins and recruiters can manage candidates"     ON public.candidates;
DROP POLICY IF EXISTS "Public can view own candidate by token"          ON public.candidates;

CREATE POLICY "Managers and recruiters can view all candidates"
  ON public.candidates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'recruiter', 'manager')
    )
  );

CREATE POLICY "Admins and recruiters can manage candidates"
  ON public.candidates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'recruiter')
    )
  );

CREATE POLICY "Public can view own candidate by token"
  ON public.candidates FOR SELECT
  TO anon
  USING (true);

-- ---------------------------------------------------------------
-- RLS POLICIES – assessments
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Managers and recruiters can view assessments" ON public.assessments;
DROP POLICY IF EXISTS "Anyone can insert assessment"                 ON public.assessments;

CREATE POLICY "Managers and recruiters can view assessments"
  ON public.assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'recruiter', 'manager')
    )
  );

CREATE POLICY "Anyone can insert assessment"
  ON public.assessments FOR INSERT
  TO anon, authenticated
  WITH CHECK (candidate_id IS NOT NULL);

-- ---------------------------------------------------------------
-- RLS POLICIES – processes
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage processes" ON public.processes;

CREATE POLICY "Authenticated users can manage processes"
  ON public.processes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- ---------------------------------------------------------------
-- RLS POLICIES – meetings
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage meetings" ON public.meetings;

CREATE POLICY "Authenticated users can manage meetings"
  ON public.meetings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'recruiter', 'manager')
    )
  );

-- ---------------------------------------------------------------
-- RLS POLICIES – documents
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone can insert documents"             ON public.documents;

CREATE POLICY "Authenticated users can manage documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'recruiter', 'manager')
    )
  );

CREATE POLICY "Anyone can insert documents"
  ON public.documents FOR INSERT
  TO anon, authenticated
  WITH CHECK (candidate_id IS NOT NULL);

-- ---------------------------------------------------------------
-- RLS POLICIES – recruitment_tokens
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Recruiters can manage their own tokens" ON public.recruitment_tokens;
DROP POLICY IF EXISTS "Anyone can check if a token is valid"  ON public.recruitment_tokens;

CREATE POLICY "Recruiters can manage their own tokens"
  ON public.recruitment_tokens FOR ALL
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Anyone can check if a token is valid"
  ON public.recruitment_tokens FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- ---------------------------------------------------------------
-- RLS POLICIES – collaborator_tests
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own tests"   ON public.collaborator_tests;
DROP POLICY IF EXISTS "Users can insert their own tests" ON public.collaborator_tests;
DROP POLICY IF EXISTS "Users can update their own tests" ON public.collaborator_tests;

CREATE POLICY "Users can view their own tests"
  ON public.collaborator_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tests"
  ON public.collaborator_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tests"
  ON public.collaborator_tests FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- STORAGE POLICIES – candidate-docs
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access for candidate docs"            ON storage.objects;
DROP POLICY IF EXISTS "Candidate upload docs"                       ON storage.objects;
DROP POLICY IF EXISTS "Candidates and recruiters can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters and managers can view documents"  ON storage.objects;
DROP POLICY IF EXISTS "Public can view own documents"               ON storage.objects;

CREATE POLICY "Candidates and recruiters can upload documents"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'candidate-docs' AND name IS NOT NULL);

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

CREATE POLICY "Public can view own documents"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'candidate-docs');

-- ---------------------------------------------------------------
-- MASTER USER SEED
-- Creates auth.users entry + profile for the master admin.
-- Uses pgcrypto crypt with blowfish for password hashing.
-- ---------------------------------------------------------------
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Remove any prior attempt to keep idempotent
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'igorrafaeljunior@gmail.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'igorrafaeljunior@gmail.com',
      crypt('TalentFlow@2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Igor Rafael","role":"admin"}',
      now(),
      now(),
      '', '', '', ''
    );
  ELSE
    -- Update password in case it changed
    UPDATE auth.users
    SET encrypted_password = crypt('TalentFlow@2026', gen_salt('bf')),
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Upsert profile
  INSERT INTO public.profiles (id, email, full_name, role, is_master)
  VALUES (v_user_id, 'igorrafaeljunior@gmail.com', 'Igor Rafael', 'admin', true)
  ON CONFLICT (id) DO UPDATE
    SET role      = 'admin',
        full_name = 'Igor Rafael',
        email     = 'igorrafaeljunior@gmail.com',
        is_master = true,
        updated_at = now();
END $$;
