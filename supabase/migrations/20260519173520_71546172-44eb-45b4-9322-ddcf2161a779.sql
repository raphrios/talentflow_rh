-- Ajustar a função is_admin com search_path seguro e restrições de execução
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revogar acesso público à função
REVOKE EXECUTE ON FUNCTION is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION is_admin() FROM authenticated;

-- Conceder apenas o necessário (se precisar ser usada por alguém específico ou via RPC interno)
-- Como ela é usada em políticas, o motor do Postgres já tem acesso via SECURITY DEFINER
