-- Tracks which entrants have already been sent the post-event thank-you
-- email, so a partial send can be completed without emailing people twice.
alter table event_entries add column if not exists thank_you_sent_at timestamptz;
