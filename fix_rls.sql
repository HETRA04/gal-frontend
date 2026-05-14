-- Run this in Supabase SQL Editor to fix auth
-- Disable RLS on profiles so login works
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE learner_profiles DISABLE ROW LEVEL SECURITY;

-- Make sure all users have profile rows
INSERT INTO profiles (id, role, full_name, email, onboarding_done)
SELECT 
  u.id,
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'learner'),
  COALESCE(NULLIF(u.raw_user_meta_data->>'full_name',''), split_part(u.email,'@',1)),
  u.email,
  true
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Fix admin account
UPDATE profiles SET role = 'admin'::user_role WHERE email = 'ceo@salesopenscaling.com';

-- Check all accounts
SELECT email, role, onboarding_done FROM profiles ORDER BY created_at DESC;
