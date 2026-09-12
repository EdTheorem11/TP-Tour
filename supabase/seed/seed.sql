-- TP TOUR — Initial seed data
-- Run AFTER migrations 001-004. Safe to re-run (uses upserts where sensible).

-- ============================================================================
-- Golf clubs used in the 2026/27 schedule
-- ============================================================================

insert into golf_clubs (id, name, location, emirate, description) values
  ('11111111-1111-1111-1111-111111111101', 'Yas Links', 'Abu Dhabi', 'Abu Dhabi', null),
  ('11111111-1111-1111-1111-111111111102', 'The Els Club', 'Dubai', 'Dubai', null),
  ('11111111-1111-1111-1111-111111111103', 'Dubai Hills Golf Club', 'Dubai', 'Dubai', null),
  ('11111111-1111-1111-1111-111111111104', 'Saadiyat', 'Abu Dhabi', 'Abu Dhabi', null),
  ('11111111-1111-1111-1111-111111111105', 'The Montgomerie', 'Dubai', 'Dubai', null)
on conflict (id) do nothing;

insert into courses (id, golf_club_id, name) values
  ('22222222-2222-2222-2222-222222222101', '11111111-1111-1111-1111-111111111101', 'Yas Links'),
  ('22222222-2222-2222-2222-222222222102', '11111111-1111-1111-1111-111111111102', 'The Els Club'),
  ('22222222-2222-2222-2222-222222222103', '11111111-1111-1111-1111-111111111103', 'Dubai Hills Golf Club'),
  ('22222222-2222-2222-2222-222222222104', '11111111-1111-1111-1111-111111111104', 'Saadiyat'),
  ('22222222-2222-2222-2222-222222222105', '11111111-1111-1111-1111-111111111105', 'The Montgomerie')
on conflict (id) do nothing;

-- ============================================================================
-- Season: TP Tour 2026/27
-- ============================================================================

insert into seasons (id, name, start_date, end_date, is_current) values
  ('33333333-3333-3333-3333-333333333301', '2026/27', '2026-09-01', '2027-06-30', true)
on conflict (id) do nothing;

-- ============================================================================
-- 2026/27 Tour Schedule — unknown fields (times, prices, formats, capacity,
-- deadlines, handicap allowance, sponsor) are left null and are editable
-- from the admin panel as TBC.
-- ============================================================================

insert into events (id, season_id, name, slug, golf_club_id, course_id, location, event_date, status) values
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'Yas Links', 'yas-links-sep-2026',
    '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222101', 'Abu Dhabi', '2026-09-06', 'completed'),

  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 'The Els Club', 'the-els-club-oct-2026',
    '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222102', 'Dubai', '2026-10-04', 'entries_open'),

  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', 'Dubai Hills Golf Club', 'dubai-hills-nov-2026',
    '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222103', 'Dubai', '2026-11-28', 'coming_soon'),

  ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333301', 'Saadiyat', 'saadiyat-jan-2027',
    '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222104', 'Abu Dhabi', '2027-01-23', 'coming_soon'),

  ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333301', 'The Montgomerie', 'the-montgomerie-feb-2027',
    '11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222105', 'Dubai', '2027-02-20', 'coming_soon'),

  ('44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333301', 'Saadiyat', 'saadiyat-mar-2027',
    '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222104', 'Abu Dhabi', '2027-03-21', 'coming_soon'),

  ('44444444-4444-4444-4444-444444444407', '33333333-3333-3333-3333-333333333301', 'Yas Links', 'yas-links-may-2027',
    '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222101', 'Abu Dhabi', '2027-05-01', 'coming_soon')
on conflict (id) do nothing;

-- ============================================================================
-- Site content — homepage statistics + copy (admin-editable, seeded with launch values)
-- ============================================================================

insert into site_content (key, value) values
  ('homepage_stats', '{"members": "250+", "tour_events": "7", "premium_courses": "6", "tour_champions": "1"}'::jsonb),
  ('homepage_hero', '{
     "eyebrow": "Dubai · Abu Dhabi · UAE",
     "heading": "GOLF. NETWORK. COMPETE.",
     "subheading": "The UAE''s leading golf society for professionals across Finance, Crypto, Digital Assets and FinTech."
   }'::jsonb),
  ('about_copy', '{
     "headline": "MORE THAN JUST GOLF.",
     "body": "TP Tour brings together professionals from Finance, Crypto, Digital Assets and FinTech through competitive golf at some of the UAE''s best courses. Play great courses. Meet good people. Compete. Build relationships naturally."
   }'::jsonb),
  ('handicap_settings', '{"auto_approve": false}'::jsonb),
  ('membership_settings', '{"require_approval": true}'::jsonb),
  ('social_links', '{"linkedin": "", "instagram": ""}'::jsonb),
  ('contact_details', '{"email": "info@tptour.ae", "whatsapp": ""}'::jsonb)
on conflict (key) do nothing;
