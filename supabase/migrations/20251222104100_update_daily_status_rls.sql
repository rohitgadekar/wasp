-- Update RLS policies for daily_task_status to allow moderators and owners to manage statuses for anyone
-- First, we ensure the policies are updated to include moderator and owner roles

-- Policy for SELECT: Everyone can already view all statuses (based on StatusViewer.tsx fetching everything)
-- But let's make it explicit if it wasn't
DROP POLICY IF EXISTS "Users can view all statuses" ON public.daily_task_status;
CREATE POLICY "Users can view all statuses"
ON public.daily_task_status FOR SELECT
TO authenticated
USING (true);

-- Policy for INSERT: Users can insert their own, or moderators/owners can insert for anyone
DROP POLICY IF EXISTS "Users can insert their own status" ON public.daily_task_status;
CREATE POLICY "Users can insert or moderators can manage"
ON public.daily_task_status FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Policy for UPDATE: Users can update their own, or moderators/owners can update for anyone
DROP POLICY IF EXISTS "Users can update their own status" ON public.daily_task_status;
CREATE POLICY "Users can update or moderators can manage"
ON public.daily_task_status FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
)
WITH CHECK (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Policy for DELETE: Users can delete their own, or moderators/owners can delete for anyone
DROP POLICY IF EXISTS "Users can delete their own status" ON public.daily_task_status;
CREATE POLICY "Users can delete or moderators can manage"
ON public.daily_task_status FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
);
