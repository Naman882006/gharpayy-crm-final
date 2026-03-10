import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  try {
    // mark overdue reminders as due
    const { error: upErr } = await supabase
      .from('follow_up_reminders')
      .update({ status: 'due' })
      .lte('reminder_date', new Date().toISOString())
      .eq('is_completed', false)
      .neq('status', 'due');
    if (upErr) throw upErr;

    // fetch due reminders to notify
    const { data: due, error: selErr } = await supabase
      .from('follow_up_reminders')
      .select('lead_id,assigned_agent_id')
      .eq('status', 'due');
    if (selErr) throw selErr;

    for (const r of due || []) {
      const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .select('name')
        .eq('id', r.lead_id)
        .single();
      if (leadErr) continue;
      await supabase.from('notifications').insert({
        user_id: r.assigned_agent_id,
        type: 'info',
        title: 'Follow-up due',
        body: `Reminder for lead ${lead?.name}`,
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('process-reminders error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});