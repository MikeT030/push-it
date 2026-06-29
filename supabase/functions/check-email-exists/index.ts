import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Use admin listUsers with a filter via the REST endpoint
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    } as any)

    // listUsers doesn't filter by email, so fall back to a direct lookup:
    // Use the GoTrue admin API to search by email.
    const url = `${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/users?email=${encodeURIComponent(email)}`
    const resp = await fetch(url, {
      headers: {
        apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
      },
    })
    const json = await resp.json()
    const users = Array.isArray(json?.users) ? json.users : []
    const exists = users.some((u: any) => (u.email ?? '').toLowerCase() === email.toLowerCase())

    return new Response(JSON.stringify({ exists }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
