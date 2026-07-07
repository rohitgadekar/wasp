-- Create tickets table for Jira tracking
CREATE TABLE public.tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  jira_link text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can view tickets
CREATE POLICY "Anyone can view tickets"
ON public.tickets
FOR SELECT
USING (true);

-- Users can insert their own tickets
CREATE POLICY "Users can insert their own tickets"
ON public.tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets
CREATE POLICY "Users can update their own tickets"
ON public.tickets
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own tickets
CREATE POLICY "Users can delete their own tickets"
ON public.tickets
FOR DELETE
USING (auth.uid() = user_id);

-- Super users can update all tickets
CREATE POLICY "Super users can update all tickets"
ON public.tickets
FOR UPDATE
USING (has_role(auth.uid(), 'super_user'::app_role));

-- Super users can delete all tickets
CREATE POLICY "Super users can delete all tickets"
ON public.tickets
FOR DELETE
USING (has_role(auth.uid(), 'super_user'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();