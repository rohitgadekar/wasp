import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, history, model } = await req.json();
    console.log(`[OpenRouterChat] Received prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}" (model: ${model || 'default'})`);
    console.log(`[OpenRouterChat] History length: ${history?.length || 0} messages`);

    if (!prompt) {
      console.error('[OpenRouterChat] Error: Prompt is required');
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[OpenRouterChat] Error: Unauthorized (No Auth Header)');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('[OpenRouterChat] Error: Invalid token or user not found', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log(`[OpenRouterChat] Authenticated user: ${user.email}`);

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      console.error('[OpenRouterChat] Error: OPENROUTER_API_KEY missing from environment');
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. RAG: Generate Embedding for the User Prompt using the internal edge function (graceful fallback)
    let snippets: any[] = [];
    let wikiPages: any[] = [];
    try {
      console.log('[OpenRouterChat] Attempting query embedding...');
      const embedResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/openrouter-generate-embedding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: prompt })
      });

      if (embedResponse.ok) {
        const { embedding: query_embedding } = await embedResponse.json();
        if (query_embedding) {
          const { data: matchedSnippets } = await supabaseAdmin.rpc('match_code_snippets_openrouter', {
            query_embedding,
            match_threshold: 0.3,
            match_count: 5
          });
          if (matchedSnippets) snippets = matchedSnippets;

          const { data: matchedWiki } = await supabaseAdmin.rpc('match_wiki_pages_openrouter', {
            query_embedding,
            match_threshold: 0.3,
            match_count: 3
          });
          if (matchedWiki) wikiPages = matchedWiki;
        }
      } else {
        console.warn('[OpenRouterChat] Embedding service returned non-200. Proceeding with general knowledge.');
      }
    } catch (ragErr) {
      console.warn('[OpenRouterChat] RAG retrieval skipped:', ragErr);
    }

    // 4. Construct the System Prompt (aligned identically with ai-chat)
    let systemContext = "You are Nyra, an elite, highly skilled developer assistant embedded within the Wasp application.\n";
    systemContext += "You have access to the following RELEVANT code snippets and wiki documentation retrieved from the organization's knowledge base. Use them to provide highly contextual, error-free answers.\n";
    systemContext += "Additionally, you are aware that this Wasp application contains a Map Generator page (for visualizing and creating maps) and a Document Finder page (for searching documents). You can suggest the user visit these pages if their query is related to maps or finding documents.\n\n";

    if (snippets && snippets.length > 0) {
      systemContext += "--- RELEVANT REPOSITORY CODE SNIPPETS ---\n\n";
      snippets.forEach((s: any, index: number) => {
        systemContext += `Match ${index + 1}: ${s.title}\n`;
        if (s.description) systemContext += `Description: ${s.description}\n`;
        systemContext += `Language: ${s.language}\n`;
        systemContext += `Code:\n\`\`\`${s.language}\n${s.code}\n\`\`\`\n\n`;
      });
    }

    if (wikiPages && wikiPages.length > 0) {
      systemContext += "--- RELEVANT REPOSITORY WIKI PAGES ---\n\n";
      wikiPages.forEach((w: any, index: number) => {
        systemContext += `Match ${index + 1}: ${w.title}\n`;
        if (w.category) systemContext += `Category: ${w.category}\n`;
        systemContext += `Content:\n${w.content}\n\n`;
      });
    }

    if ((!snippets || snippets.length === 0) && (!wikiPages || wikiPages.length === 0)) {
      systemContext += "(No highly relevant snippets or wiki pages were found for this specific query. Answer based on general programming knowledge but encourage the user to add more context to their code library or wiki.)\n\n";
    }

    systemContext += "Instructions:\n";
    systemContext += "- Always provide error-free, copy-pasteable code.\n";
    systemContext += "- When referencing a provided snippet, NEVER just say 'using Snippet X'. Instead, explicitly state the snippet's title and SHOW the actual method or code being used in your response.\n";
    systemContext += "- Maintain a professional, helpful, and elite tone as Nyra.\n";
    systemContext += "- If the user asks for a modification, return the fully modified block if appropriate.\n";

    console.log(`[OpenRouterChat] System Context constructed. Length: ${systemContext.length} chars.`);

    // 5. Call OpenRouter API for Chat
    const messages = [
      { role: 'system', content: systemContext },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: prompt }
    ];

    const requestedModel = (model && typeof model === 'string') ? model : "openrouter/free";
    console.log(`[OpenRouterChat] Calling OpenRouter API (model: ${requestedModel})...`);

    let openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://supabase.com',
        'X-Title': 'Wasp App'
      },
      body: JSON.stringify({
        model: requestedModel,
        messages,
        temperature: 0.2,
        stream: true
      })
    });

    // If requested model is unavailable for free or returns 404, auto-fallback to openrouter/free
    if (!openRouterResponse.ok && requestedModel !== "openrouter/free") {
      const errorText = await openRouterResponse.text();
      console.warn(`[OpenRouterChat] Model ${requestedModel} failed (${openRouterResponse.status}): ${errorText}. Falling back to openrouter/free...`);

      openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://supabase.com',
          'X-Title': 'Wasp App'
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages,
          temperature: 0.2,
          stream: true
        })
      });
    }

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('[OpenRouterChat] OpenRouter API Error Response:', errorText);
      return new Response(JSON.stringify({ error: `AI provider error: ${errorText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[OpenRouterChat] OpenRouter connection successful. Starting stream...');

    return new Response(openRouterResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (err: any) {
    console.error('Unexpected error in openrouter-chat:', err);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
