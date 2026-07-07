-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding columns (768 dimensions for Gemini text-embedding-004)
ALTER TABLE code_snippets ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Create function to search code snippets
CREATE OR REPLACE FUNCTION match_code_snippets (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  code text,
  language text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    code_snippets.id,
    code_snippets.title,
    code_snippets.description,
    code_snippets.code,
    code_snippets.language,
    1 - (code_snippets.embedding <=> query_embedding) AS similarity
  FROM code_snippets
  WHERE 1 - (code_snippets.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 4. Create function to search wiki pages
CREATE OR REPLACE FUNCTION match_wiki_pages (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wiki_pages.id,
    wiki_pages.title,
    wiki_pages.content,
    wiki_pages.category,
    1 - (wiki_pages.embedding <=> query_embedding) AS similarity
  FROM wiki_pages
  WHERE 1 - (wiki_pages.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 5. Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 6. Create function to invoke edge functions
CREATE OR REPLACE FUNCTION public.handle_embedding_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoke generate-embedding for the specific record
  PERFORM
    net.http_post(
      url := 'https://nslyikktilelnqigidvk.supabase.co/functions/v1/generate-embedding',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'table', TG_TABLE_NAME
      )
    );
    
  -- Invoke sync-embeddings to ensure overall consistency
  PERFORM
    net.http_post(
      url := 'https://nslyikktilelnqigidvk.supabase.co/functions/v1/sync-embeddings',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create triggers for code_snippets and wiki_pages
CREATE TRIGGER on_code_snippet_change
  AFTER INSERT OR UPDATE ON public.code_snippets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_embedding_sync();

CREATE TRIGGER on_wiki_page_change
  AFTER INSERT OR UPDATE ON public.wiki_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_embedding_sync();

