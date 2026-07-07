-- Update RLS policies for wiki_pages to allow moderators and owners to manage any record
-- Policy for INSERT: Users can insert their own, or moderators/owners can manage
DROP POLICY IF EXISTS "Users can insert their own wiki pages" ON public.wiki_pages;
CREATE POLICY "Users can insert or moderators/owners can manage"
ON public.wiki_pages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Policy for UPDATE: Users can update their own, or moderators/owners can manage
DROP POLICY IF EXISTS "Users can update their own wiki pages" ON public.wiki_pages;
CREATE POLICY "Users can update or moderators/owners can manage"
ON public.wiki_pages FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- Policy for DELETE: Users can delete their own, or moderators/owners can manage
DROP POLICY IF EXISTS "Users can delete their own wiki pages" ON public.wiki_pages;
CREATE POLICY "Users can delete or moderators/owners can manage"
ON public.wiki_pages FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
  public.has_role(auth.uid(), 'owner'::public.app_role)
);
