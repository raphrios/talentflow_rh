-- Definir admin master para o email solicitado
DO $$ 
DECLARE 
    target_user_id UUID;
BEGIN 
    -- Tentar encontrar o ID do usuário pelo email
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'igorrafaeljunior@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Garantir que o perfil existe e é admin
        INSERT INTO public.profiles (id, role, full_name)
        VALUES (target_user_id, 'admin', 'Admin Master')
        ON CONFLICT (id) DO UPDATE SET role = 'admin';
    END IF;
END $$;
