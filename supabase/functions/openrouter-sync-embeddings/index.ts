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

    const tables = ['code_snippets', 'wiki_pages'];
    let totalFound = 0;

    for (const table of tables) {
      // Find rows missing OpenRouter embeddings
      const { data: records, error: fetchError } = await supabaseAdmin
        .from(table)
        .select('id, title')
        .is('openrouter_embedding', null);

      if (fetchError) throw fetchError;

      if (records && records.length > 0) {
        console.log(`Found ${records.length} records in ${table} missing OpenRouter embeddings.`);
        totalFound += records.length;

        // Process in small batches or one by one to avoid timeouts
        for (const record of records) {
          // We fetch the full record to pass it to the generator
          const { data: fullRecord } = await supabaseAdmin
            .from(table)
            .select('*')
            .eq('id', record.id)
            .single();

          if (fullRecord) {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/openrouter-generate-embedding`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ record: fullRecord, table })
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${totalFound} records for OpenRouter embeddings.` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Sync Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
