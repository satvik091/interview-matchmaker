-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Candidates can book available slots" ON public.interview_slots;

-- Create a more secure policy that only allows authenticated users to book
CREATE POLICY "Authenticated users can book available slots"
  ON public.interview_slots FOR UPDATE
  USING (auth.uid() IS NOT NULL AND is_booked = false)
  WITH CHECK (auth.uid() IS NOT NULL);