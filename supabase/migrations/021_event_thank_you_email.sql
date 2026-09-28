-- Tracks whether the "thanks for playing" batch email has been sent for an
-- event, so the daily cron job never sends it twice for the same event.
alter table events add column attendee_thank_you_sent_at timestamptz;
