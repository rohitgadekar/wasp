import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    // 1. Sync Code Snippets
    console.log('Fetching snippets without embeddings...');
    const { data: snippets, error: snippetsFetchError } = await supabaseAdmin
      .from('code_snippets')
      .select('id, title, description, code')
      .is('embedding', null);

    if (snippetsFetchError) throw snippetsFetchError;
    console.log(`Found ${snippets?.length || 0} snippets to sync.`);

    if (snippets && snippets.length > 0) {
      // Process in chunks of 100 (Gemini batch limit)
      for (let i = 0; i < snippets.length; i += 100) {
        const chunk = snippets.slice(i, i + 100);
        console.log(`Processing snippet chunk ${i / 100 + 1}...`);

        const requests = chunk.map(s => ({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: `Title: ${s.title}\nDescription: ${s.description}\nCode: ${s.code}` }] },
          taskType: "RETRIEVAL_DOCUMENT"
        }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests })
        });

        if (!response.ok) {
          console.error(`Batch embed failed: ${await response.text()}`);
          continue;
        }

        const { embeddings } = await response.json();
        
        // Update database for each snippet in chunk
        for (let j = 0; j < chunk.length; j++) {
          const { error: updateError } = await supabaseAdmin
            .from('code_snippets')
            .update({ embedding: embeddings[j].values })
            .eq('id', chunk[j].id);
          
          if (updateError) console.error(`Error updating snippet ${chunk[j].id}:`, updateError);
        }
      }
    }

    // 2. Sync Wiki Pages
    console.log('Fetching wiki pages without embeddings...');
    const { data: wikiPages, error: wikiFetchError } = await supabaseAdmin
      .from('wiki_pages')
      .select('id, title, content')
      .is('embedding', null);

    if (wikiFetchError) throw wikiFetchError;
    console.log(`Found ${wikiPages?.length || 0} wiki pages to sync.`);

    if (wikiPages && wikiPages.length > 0) {
      // Process in chunks of 100
      for (let i = 0; i < wikiPages.length; i += 100) {
        const chunk = wikiPages.slice(i, i + 100);
        console.log(`Processing wiki chunk ${i / 100 + 1}...`);

        const requests = chunk.map(p => ({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: `Title: ${p.title}\nContent: ${p.content}` }] },
          taskType: "RETRIEVAL_DOCUMENT"
        }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests })
        });

        if (!response.ok) {
          console.error(`Batch embed failed: ${await response.text()}`);
          continue;
        }

        const { embeddings } = await response.json();

        for (let j = 0; j < chunk.length; j++) {
          const { error: updateError } = await supabaseAdmin
            .from('wiki_pages')
            .update({ embedding: embeddings[j].values })
            .eq('id', chunk[j].id);
          
          if (updateError) console.error(`Error updating wiki page ${chunk[j].id}:`, updateError);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      synced_snippets: snippets?.length || 0,
      synced_wiki: wikiPages?.length || 0 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
