import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Initialize Supabase Admin client once at the top level
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

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing from environment variables.');
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured in Supabase secrets.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Debug log to verify key presence (masked for safety)
    console.log(`[Version 1.0.2] Initializing Gemini call. Key prefix: ${GEMINI_API_KEY.slice(0, 4)}`);

    // 2. RAG: Generate Embedding for the User Prompt
    const embedUrl = `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const embedResponse = await fetch(embedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: prompt }] },
        taskType: "RETRIEVAL_QUERY"
      })
    });

    if (!embedResponse.ok) {
      const errorData = await embedResponse.text();
      console.error('Gemini Embedding API Error:', errorData);
      throw new Error(`Failed to generate query embedding: ${errorData}`);
    }
    const embedData = await embedResponse.json();
    const query_embedding = embedData.embedding.values;

    // 3. RAG: Perform Semantic Search
    // Search Code Snippets
    const { data: snippets, error: snippetsError } = await supabaseAdmin.rpc('match_code_snippets', {
      query_embedding,
      match_threshold: 0.3,
      match_count: 5
    });

    // Search Wiki Pages
    const { data: wikiPages, error: wikiError } = await supabaseAdmin.rpc('match_wiki_pages', {
      query_embedding,
      match_threshold: 0.3,
      match_count: 3
    });

    if (snippetsError) console.error('Error fetching snippets:', snippetsError);
    if (wikiError) console.error('Error fetching wiki pages:', wikiError);

    // 4. Construct the System Prompt with retrieved context
    let systemContext = "You are Lumen, an elite, highly skilled developer assistant embedded within the Wasp application.\n";
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
    systemContext += "- Maintain a professional, helpful, and elite tone as Lumen.\n";
    systemContext += "- If the user asks for a modification, return the fully modified block if appropriate.\n";

    // 5. Call Gemini API for Chat
    const targetModel = (model && typeof model === 'string' && model.startsWith('gemini-')) ? model : 'gemini-1.5-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${targetModel}:streamGenerateContent?alt=sse&key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemContext }]
      },
      contents: [
        ...formattedHistory,
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
      }
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      let errorMsg = 'Failed to generate response from AI provider.';
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error?.message || errorMsg;
      } catch (e) {
        errorMsg = errorText || errorMsg;
      }

      console.error('Gemini API Error:', errorText);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(geminiResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (err: any) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});


