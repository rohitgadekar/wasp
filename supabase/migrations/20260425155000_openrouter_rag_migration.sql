-- 1. Add embedding columns (2048 dimensions for NVIDIA Llama Nemotron)
ALTER TABLE code_snippets ADD COLUMN IF NOT EXISTS openrouter_embedding vector(2048);
ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS openrouter_embedding vector(2048);

-- 2. Create function to search code snippets using OpenRouter embeddings
CREATE OR REPLACE FUNCTION match_code_snippets_openrouter (
  query_embedding vector(2048),
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
    1 - (code_snippets.openrouter_embedding <=> query_embedding) AS similarity
  FROM code_snippets
  WHERE 1 - (code_snippets.openrouter_embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 3. Create function to search wiki pages using OpenRouter embeddings
CREATE OR REPLACE FUNCTION match_wiki_pages_openrouter (
  query_embedding vector(2048),
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
    1 - (wiki_pages.openrouter_embedding <=> query_embedding) AS similarity
  FROM wiki_pages
  WHERE 1 - (wiki_pages.openrouter_embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 4. Create function to invoke the new openrouter embedding edge function
CREATE OR REPLACE FUNCTION public.handle_openrouter_embedding_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoke openrouter-generate-embedding for the specific record
  PERFORM
    net.http_post(
      url := 'https://nslyikktilelnqigidvk.supabase.co/functions/v1/openrouter-generate-embedding',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'table', TG_TABLE_NAME
      )
    );
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create triggers for code_snippets and wiki_pages
DROP TRIGGER IF EXISTS on_code_snippet_change_openrouter ON public.code_snippets;
CREATE TRIGGER on_code_snippet_change_openrouter
  AFTER INSERT OR UPDATE ON public.code_snippets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_openrouter_embedding_sync();

DROP TRIGGER IF EXISTS on_wiki_page_change_openrouter ON public.wiki_pages;
CREATE TRIGGER on_wiki_page_change_openrouter
  AFTER INSERT OR UPDATE ON public.wiki_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_openrouter_embedding_sync();
