-- Update daily_task_status RLS policies to include the 'manager' role
-- This allows managers to synchronize leave status with daily logs

-- Update INSERT policy
DROP POLICY IF EXISTS "Users can insert or moderators can manage" ON public.daily_task_status;
CREATE POLICY "Users can insert or managers/owners can manage"
ON public.daily_task_status FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'manager'::public.app_role) OR 
  public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Update UPDATE policy
DROP POLICY IF EXISTS "Users can update or moderators can manage" ON public.daily_task_status;
CREATE POLICY "Users can update or managers/owners can manage"
ON public.daily_task_status FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'manager'::public.app_role) OR 
  public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
)
WITH CHECK (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'manager'::public.app_role) OR 
  public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Update DELETE policy
DROP POLICY IF EXISTS "Users can delete or moderators can manage" ON public.daily_task_status;
CREATE POLICY "Users can delete or managers/owners can manage"
ON public.daily_task_status FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'manager'::public.app_role) OR 
  public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
);
