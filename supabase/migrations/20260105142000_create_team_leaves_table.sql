-- Create team_leaves table
CREATE TABLE IF NOT EXISTS public.team_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT DEFAULT 'Leave',
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_leaves ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view team leaves"
  ON public.team_leaves FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Moderators and owners can manage team leaves"
  ON public.team_leaves FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'owner')
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_leaves;
