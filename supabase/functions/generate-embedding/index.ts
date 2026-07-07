import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let textToEmbed = "";
    let table = "";
    let id = "";

    // 1. Detect if this is a Supabase Webhook or a manual text call
    if (body.record) {
      // It's a Webhook trigger
      table = body.table;
      id = body.record.id;
      
      if (table === 'code_snippets') {
        textToEmbed = `Title: ${body.record.title}\nDescription: ${body.record.description}\nCode: ${body.record.code}`;
      } else if (table === 'wiki_pages') {
        textToEmbed = `Title: ${body.record.title}\nContent: ${body.record.content}`;
      }
    } else {
      // It's a manual call
      textToEmbed = body.text;
    }

    if (!textToEmbed) {
      return new Response(JSON.stringify({ error: 'No text found to embed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Generate Embedding
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text: textToEmbed }] },
        taskType: "RETRIEVAL_DOCUMENT"
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error }), { status: 502, headers: corsHeaders });
    }

    const data = await response.json();
    const embedding = data.embedding.values;

    // 3. If it's a Webhook, automatically update the row
    if (body.record && table && id) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update({ embedding })
        .eq('id', id);

      if (updateError) throw updateError;
      
      return new Response(JSON.stringify({ success: true, message: `Updated ${table}:${id}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Return embedding for manual calls
    return new Response(JSON.stringify({ embedding }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
