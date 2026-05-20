-- Revoke public and authenticated execute permissions
REVOKE EXECUTE ON FUNCTION create_recruiter(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_recruiter(TEXT, TEXT, TEXT, TEXT) FROM authenticated;

-- Allow master email to execute via a check inside the function
CREATE OR REPLACE FUNCTION create_recruiter(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_caller_email TEXT;
BEGIN
  -- Get current user email
  v_caller_email := (SELECT email FROM auth.users WHERE id = auth.uid());
  
  -- Strict master check
  IF v_caller_email IS NULL OR LOWER(v_caller_email) != 'igorrafaeljunior@gmail.com' THEN
    RAISE EXCEPTION 'Acesso negado: apenas o Administrador Master pode criar usuários.';
  END IF;

  -- Create user in auth.users
  INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (
    LOWER(p_email),
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO v_user_id;

  -- Create profile
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (v_user_id, p_full_name, p_role);

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant back to authenticated but with internal check
GRANT EXECUTE ON FUNCTION create_recruiter(TEXT, TEXT, TEXT, TEXT) TO authenticated;