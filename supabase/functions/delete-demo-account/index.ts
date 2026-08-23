// Admin-only: delete a demo account by id.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
      _user_id: callerId, _role: 'admin',
    });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id } = await req.json();
    if (typeof user_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(user_id)) {
      return new Response(JSON.stringify({ error: 'Invalid user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Safety: only allow deleting demo accounts (profile flagged is_test,
    // or the auth user carries the demo marker in its metadata).
    const { data: prof, error: pErr } = await admin
      .from('profiles').select('is_test').eq('id', user_id).maybeSingle();
    if (pErr) {
      return new Response(JSON.stringify({ error: pErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: authUser } = await admin.auth.admin.getUserById(user_id);
    const meta = (authUser?.user?.user_metadata ?? {}) as Record<string, unknown>;
    const metaIsDemo = meta.is_test === true || meta.is_demo === true;

    // Already gone from auth: just clean up any leftover profile row.
    if (!authUser?.user) {
      if (prof?.is_test) await admin.from('profiles').delete().eq('id', user_id);
      return new Response(JSON.stringify({ ok: true, alreadyDeleted: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!prof?.is_test && !metaIsDemo) {
      return new Response(JSON.stringify({ error: 'Not a demo account' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(user_id);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    await admin.from('profiles').delete().eq('id', user_id);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
