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

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Generate Embedding via OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://supabase.com',
        'X-Title': 'Wasp App'
      },
      body: JSON.stringify({
        model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
        input: textToEmbed
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter Embedding Error:', errorText);
      return new Response(JSON.stringify({ error: `OpenRouter error: ${errorText}` }), { 
        status: 502, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('Invalid response from OpenRouter embedding API');
    }
    const embedding = data.data[0].embedding;

    // 3. If it's a Webhook, automatically update the row
    if (body.record && table && id) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update({ openrouter_embedding: embedding })
        .eq('id', id);

      if (updateError) throw updateError;
      
      return new Response(JSON.stringify({ success: true, message: `Updated ${table}:${id} with OpenRouter embedding` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Return embedding for manual calls
    return new Response(JSON.stringify({ embedding }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Unexpected error in openrouter-generate-embedding:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
