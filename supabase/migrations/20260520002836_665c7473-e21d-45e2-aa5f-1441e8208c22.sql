ALTER FUNCTION public.generate_token(INT) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.generate_token(INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_token(INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.generate_token(INT) TO authenticated;
