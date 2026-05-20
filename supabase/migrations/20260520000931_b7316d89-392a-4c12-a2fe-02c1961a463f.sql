CREATE OR REPLACE FUNCTION public.delete_recruiter(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_master_caller BOOLEAN;
BEGIN
  -- Security check
  SELECT (auth.email() = 'igorrafaeljunior@gmail.com') INTO is_master_caller;
  
  IF NOT is_master_caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  -- Delete from auth.users (this will likely fail if RLS/permissions aren't right, 
  -- but as SECURITY DEFINER it should work if we have bypassrls or proper grants)
  DELETE FROM auth.users WHERE id = p_user_id;
  
  -- Delete from public.profiles
  DELETE FROM public.profiles WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_recruiter TO authenticated;
