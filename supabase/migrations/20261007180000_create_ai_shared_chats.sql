-- Create ai_shared_chats table for sharing chat sessions (like ChatGPT and Grok)
CREATE TABLE IF NOT EXISTS public.ai_shared_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  shared_by_name TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_shared_chats ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (including unauthenticated visitors with link) can view public shared chats
CREATE POLICY "Public read for shared chats"
  ON public.ai_shared_chats FOR SELECT
  USING (is_public = true);

-- 2. Authenticated users can insert their own shared chats
CREATE POLICY "Authenticated users can insert shared chats"
  ON public.ai_shared_chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own shared chats
CREATE POLICY "Users can update own shared chats"
  ON public.ai_shared_chats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Users can delete their own shared chats
CREATE POLICY "Users can delete own shared chats"
  ON public.ai_shared_chats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookup by id and user_id
CREATE INDEX IF NOT EXISTS ai_shared_chats_user_id_idx ON public.ai_shared_chats(user_id);
CREATE INDEX IF NOT EXISTS ai_shared_chats_created_at_idx ON public.ai_shared_chats(created_at DESC);
