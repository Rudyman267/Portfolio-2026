// @ts-ignore — Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// @ts-ignore — Deno runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// @ts-ignore — Deno runtime
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// @ts-ignore — Deno runtime
const WEBHOOK_SECRET = Deno.env.get('FLYTBASE_WEBHOOK_SECRET'); // optional

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SUPPORTED = new Set([
  'mission.execution.started',
  'mission.execution.completed',
  'mission.waypoint.reached',
  'single_media.uploaded.completed',
]);

// @ts-ignore — Deno runtime
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  if (WEBHOOK_SECRET) {
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  if (
    !body?.event_id ||
    !body?.event_type ||
    !body?.organization_id ||
    !body?.timestamp ||
    !body?.data
  ) {
    return new Response('Invalid event envelope', { status: 400, headers: corsHeaders });
  }

  if (!SUPPORTED.has(body.event_type)) {
    return new Response('OK (event type not subscribed)', {
      status: 200,
      headers: corsHeaders,
    });
  }

  const flightId = body.data?.flight_details?.flight_id;
  if (!flightId) {
    return new Response('Missing flight_id in payload', { status: 400, headers: corsHeaders });
  }

  const { error } = await supabase.from('flight_events').upsert(
    {
      event_id: body.event_id,
      event_type: body.event_type,
      org_id: body.organization_id,
      flight_id: flightId,
      timestamp: body.timestamp,
      payload: body,
    },
    { onConflict: 'event_id' }
  );

  if (error) {
    console.error('[webhook-flight-events] insert error:', error);
    return new Response('Database error', { status: 500, headers: corsHeaders });
  }

  return new Response('OK', { status: 200, headers: corsHeaders });
});
