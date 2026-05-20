CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    new.id, 
    CASE 
      WHEN new.email = 'igorrafaeljunior@gmail.com' THEN 'admin' 
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'recruiter')
    END,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Recrutador')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;