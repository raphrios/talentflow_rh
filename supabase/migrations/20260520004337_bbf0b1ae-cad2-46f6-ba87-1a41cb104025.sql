GRANT EXECUTE ON FUNCTION public.create_recruiter(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_recruiter(TEXT, TEXT, TEXT, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.delete_recruiter(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_recruiter(UUID) TO service_role;