// Creates a throwaway demo account and returns credentials so the client can sign in.
// Public endpoint (no JWT). Rate limiting is intentionally omitted — see plan.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const randomSuffix = (n: number) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  for (let i = 0; i < n; i++) s += chars[arr[i] % chars.length];
  return s;
};

const randomPassword = () => {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/[+/=]/g, '').slice(0, 20) + 'A1!';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const suffix = randomSuffix(6).toLowerCase();
    const email = `demo+${suffix}@pushit.demo`;
    const password = randomPassword();
    const displayName = `Demo ${randomSuffix(4)}`;

    // 1) Create auth user (already confirmed).
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    const created = await createRes.json();
    if (!createRes.ok || !created?.id) {
      return new Response(JSON.stringify({ error: created?.msg || created?.error || 'Failed to create demo account' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = created.id as string;

    // 2) Seed profile — mark as test cohort but leave goal unset so the user
    //    is routed through /welcome to pick a goal (same as real signup).
    const patchRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        is_test: true,
        display_name: displayName,
      }),
    });
    if (!patchRes.ok) {
      const t = await patchRes.text();
      return new Response(JSON.stringify({ error: `Failed to seed demo profile: ${t}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ email, password, displayName }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
