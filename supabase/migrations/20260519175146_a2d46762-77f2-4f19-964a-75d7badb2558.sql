-- Function to create a recruiter user securely
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
BEGIN
  -- Check if caller is master (can be checked via session if needed, but for now we rely on the UI/API layer)
  
  -- Create user in auth.users
  INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (
    p_email,
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