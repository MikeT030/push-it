-- Drop the restrictive SELECT policy and create a permissive one
DROP POLICY IF EXISTS "Authenticated users can view all user progress" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);