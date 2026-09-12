-- TP TOUR — Optional public mobile/email in the players directory
-- Defaults to hidden (opt-in), unlike company/job title, since contact
-- details are more sensitive than a job title.

alter table member_profiles add column if not exists show_contact_publicly boolean not null default false;

create or replace view player_directory as
select
  mp.id,
  mp.first_name,
  mp.last_name,
  mp.avatar_url,
  mp.current_handicap,
  mp.industry,
  case when mp.show_company_publicly then mp.company else null end as company,
  case when mp.show_job_title_publicly then mp.job_title else null end as job_title,
  mp.home_golf_club,
  case when mp.show_contact_publicly then mp.mobile else null end as mobile,
  case when mp.show_contact_publicly then mp.email else null end as email,
  s.id as current_season_id,
  oom.rank as tour_rank,
  oom.counting_points as oom_points
from member_profiles mp
left join seasons s on s.is_current = true
left join order_of_merit_points oom on oom.season_id = s.id and oom.member_id = mp.id
where mp.status = 'approved';

grant select on player_directory to authenticated;
