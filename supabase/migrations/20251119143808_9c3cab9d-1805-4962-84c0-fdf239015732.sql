-- Add foreign key to link code_snippets to profiles
ALTER TABLE public.code_snippets
DROP CONSTRAINT IF EXISTS code_snippets_author_id_fkey,
ADD CONSTRAINT code_snippets_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;