-- Primeiro removemos qualquer tentativa anterior para evitar conflitos de constraint
DELETE FROM auth.users WHERE email = 'igorrafaeljunior@gmail.com';

-- Inserimos o usuário novamente
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
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'igorrafaeljunior@gmail.com',
    crypt('122130923', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin Master"}',
    now(),
    now()
);

-- Atualizamos o perfil
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'igorrafaeljunior@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Garantimos que o perfil existe ou atualizamos se já existir
        INSERT INTO public.profiles (id, role, full_name)
        VALUES (target_user_id, 'admin', 'Admin Master')
        ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Admin Master';
    END IF;
END $$;
