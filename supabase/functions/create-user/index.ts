// supabase/functions/create-user/index.ts → FINAL WORKING VERSION
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // === 1. Verify requester is moderator/owner ===
    const authHeader = req.headers.get('Authorization');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requester } } = await supabaseAdmin.auth.getUser(token);
    if (!requester) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { data: requesterRole } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', requester.id).single();
    if (![
      'moderator',
      'owner'
    ].includes(requesterRole?.role || '')) {
      return new Response(JSON.stringify({
        error: 'Forbidden'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }
    // === 2. Parse input ===
    const { email, password, fullName, role = 'member' } = await req.json();
    if (!email || !password || !fullName) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    // Moderator cannot create moderator/owner
    if (requesterRole.role === 'moderator' && role !== 'member') {
      return new Response(JSON.stringify({
        error: 'Moderators can only create members'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }
    // === 3. Create auth user ===
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });
    if (createError || !authUser.user) {
      return new Response(JSON.stringify({
        error: createError?.message || 'Failed to create user'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const userId = authUser.user.id;
    // === 4. INSERT INTO profiles (this is critical!) ===
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      email: email.toLowerCase(),
      full_name: fullName
    });
    if (profileError) {
      // Cleanup: delete auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({
        error: 'Failed to create profile: ' + profileError.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    // === 5. INSERT INTO user_roles (with correct role) ===
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: userId,
      role: role
    });
    if (roleError) {
      // Cleanup on failure
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({
        error: 'Failed to set role: ' + roleError.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        email,
        full_name: fullName,
        role
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
