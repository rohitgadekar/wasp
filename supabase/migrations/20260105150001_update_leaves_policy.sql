-- Update RLS policy for team_leaves to include the new 'manager' role
-- Drop the old policy
DROP POLICY IF EXISTS "Moderators and owners can manage team leaves" ON public.team_leaves;

-- Create new policy for managers and owners
CREATE POLICY "Managers and owners can manage team leaves"
  ON public.team_leaves FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager'::public.app_role, 'owner'::public.app_role)
    )
  );
