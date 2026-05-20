-- Fix security issues for handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Revoke default execute permissions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;