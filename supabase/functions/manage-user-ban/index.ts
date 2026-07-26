import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requester }, error: requesterError } = await admin.auth.getUser(token);

    if (requesterError || !requester) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData, error: roleError } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', requester.id)
      .single();

    if (roleError || roleData?.role !== 'owner') {
      return new Response(JSON.stringify({ error: 'Only owners can manage account bans' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id: targetUserId, banned } = await req.json();
    if (!targetUserId || typeof banned !== 'boolean') {
      return new Response(JSON.stringify({ error: 'user_id and banned are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (targetUserId === requester.id) {
      return new Response(JSON.stringify({ error: 'You cannot ban your own account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Supabase Auth enforces the ban at sign-in. The long duration is an explicit indefinite ban;
    // sending "none" removes it when an owner restores the account.
    const { error: banError } = await admin.auth.admin.updateUserById(targetUserId, {
      ban_duration: banned ? '876000h' : 'none',
    });

    if (banError) {
      return new Response(JSON.stringify({ error: banError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: statusError } = await admin
      .from('profiles')
      .update({
        is_banned: banned,
        banned_at: banned ? new Date().toISOString() : null,
        banned_by: banned ? requester.id : null,
      })
      .eq('id', targetUserId);

    if (statusError) {
      return new Response(JSON.stringify({ error: `Auth status changed, but profile status failed: ${statusError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, banned }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
