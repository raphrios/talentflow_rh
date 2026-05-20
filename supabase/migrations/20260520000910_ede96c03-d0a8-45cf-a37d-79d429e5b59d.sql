-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to create a recruiter/admin
CREATE OR REPLACE FUNCTION public.create_recruiter(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_user_id UUID;
  is_master_caller BOOLEAN;
BEGIN
  -- Security check: only the master email can call this
  SELECT (auth.email() = 'igorrafaeljunior@gmail.com') INTO is_master_caller;
  
  IF NOT is_master_caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado. Apenas o Administrador Master pode criar usuários.');
  END IF;

  -- Create the user in auth.users
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
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Create the profile
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new_user_id, p_full_name, p_role);

  RETURN jsonb_build_object('success', true, 'user_id', new_user_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este e-mail já está cadastrado.');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant access to authenticated users (the function itself checks for master email)
GRANT EXECUTE ON FUNCTION public.create_recruiter TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_recruiter TO service_role;
