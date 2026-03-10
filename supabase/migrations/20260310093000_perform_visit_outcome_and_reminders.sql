-- Transactional visit outcome helper + reminder processor
-- Run inside a transaction to guarantee consistency

-- function: perform_visit_outcome
CREATE OR REPLACE FUNCTION public.perform_visit_outcome(
  p_visit_id uuid,
  p_outcome public.visit_outcome
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_id uuid;
  v_property_id uuid;
BEGIN
  -- lock the row to avoid racing updates
  SELECT lead_id, property_id
    INTO v_lead_id, v_property_id
    FROM public.visits
    WHERE id = p_visit_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'visit % not found', p_visit_id;
  END IF;

  -- update visit record
  UPDATE public.visits
    SET outcome = p_outcome,
        completed_at = now()
    WHERE id = p_visit_id;

  IF p_outcome = 'booked' THEN
    -- advance lead status
    UPDATE public.leads
      SET status = 'booked'
      WHERE id = v_lead_id;

    -- create booking record
    INSERT INTO public.bookings(lead_id, property_id, status)
      VALUES (v_lead_id, v_property_id, 'confirmed');

    -- log booking event (activity_log trigger covers visits/outcomes already)
    INSERT INTO public.activity_log (lead_id, action, metadata)
      VALUES (v_lead_id, 'booking_confirmed', jsonb_build_object('visit_id', p_visit_id));
  END IF;
END;
$$;

-- function: process_follow_up_reminders
CREATE OR REPLACE FUNCTION public.process_follow_up_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- mark overdue reminders as due
  UPDATE public.follow_up_reminders
    SET status = 'due'
    WHERE is_completed = false
      AND reminder_date <= now()
      AND status <> 'due';

  -- notify agents about due reminders
  INSERT INTO public.notifications (user_id, type, title, body)
  SELECT
    r.assigned_agent_id,
    'info',
    'Follow-up due',
    concat('Reminder for lead ', l.name)
  FROM public.follow_up_reminders r
  JOIN public.leads l ON l.id = r.lead_id
  WHERE r.status = 'due';
END;
$$;

-- schedule the reminder processor every 15 minutes (requires pg_cron extension)
-- if pg_cron is not available, this statement will fail silently
BEGIN
  PERFORM cron.schedule('process_followups','*/15 * * * *','SELECT public.process_follow_up_reminders();');
EXCEPTION WHEN undefined_function THEN
  -- pg_cron not installed, schedule manually or via edge function
  RAISE NOTICE 'pg_cron not available, skipping schedule creation';
END;
