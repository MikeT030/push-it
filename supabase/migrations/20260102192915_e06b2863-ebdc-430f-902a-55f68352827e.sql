-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own entries" ON public.push_up_entries;

-- Create new SELECT policy allowing all authenticated users to view all entries
CREATE POLICY "Authenticated users can view all entries"
ON public.push_up_entries
FOR SELECT
TO authenticated
USING (true);