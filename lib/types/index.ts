export type UserRole = "member" | "admin" | "super_admin";
export type MemberStatus = "pending" | "approved" | "suspended" | "rejected";

export type EventStatus =
  | "draft"
  | "coming_soon"
  | "entries_open"
  | "limited_spaces"
  | "sold_out"
  | "completed"
  | "cancelled";

export type CompetitionFormat =
  | "individual_stableford"
  | "strokeplay"
  | "pairs_betterball"
  | "texas_scramble"
  | "team"
  | "matchplay"
  | "other";

export type EntryStatus = "confirmed" | "withdrawn" | "cancelled";
export type WaitingListStatus = "waiting" | "promoted" | "removed";
export type PaymentStatus = "pending" | "paid" | "refunded" | "complimentary" | "not_required";
export type HandicapSource = "initial" | "member_submitted" | "admin_adjustment" | "event_recalc";
export type HandicapChangeStatus = "approved" | "pending";
export type SponsorLevel = "title_partner" | "official_partner" | "tour_partner" | "event_partner" | "prize_partner";

export const FORMAT_LABELS: Record<CompetitionFormat, string> = {
  individual_stableford: "Individual Stableford",
  strokeplay: "Strokeplay",
  pairs_betterball: "Pairs Betterball",
  texas_scramble: "Texas Scramble",
  team: "Team Competition",
  matchplay: "Matchplay",
  other: "Other",
};

export const STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  coming_soon: "Coming Soon",
  entries_open: "Entries Open",
  limited_spaces: "Limited Spaces",
  sold_out: "Sold Out",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const SPONSOR_LEVEL_LABELS: Record<SponsorLevel, string> = {
  title_partner: "Title Partner",
  official_partner: "Official Partner",
  tour_partner: "Tour Partner",
  event_partner: "Event Partner",
  prize_partner: "Prize Partner",
};

export interface MemberProfile {
  id: string;
  role: UserRole;
  status: MemberStatus;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string | null;
  nationality: string | null;
  company: string | null;
  job_title: string | null;
  industry: string | null;
  home_golf_club: string | null;
  home_course: string | null;
  current_handicap: number | null;
  egf_whs_number: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  show_company_publicly: boolean;
  show_job_title_publicly: boolean;
  show_contact_publicly: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GolfClub {
  id: string;
  name: string;
  location: string | null;
  emirate: string | null;
  website: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  description: string | null;
}

export interface Course {
  id: string;
  golf_club_id: string;
  name: string;
  par: number | null;
  course_rating: number | null;
  slope_rating: number | null;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  oom_points_table: Record<string, number>;
  oom_default_points: number;
  oom_major_multiplier: number;
  oom_best_results_count: number | null;
  oom_attendance_points: number;
}

export interface TourEvent {
  id: string;
  season_id: string;
  name: string;
  slug: string;
  golf_club_id: string | null;
  course_id: string | null;
  location: string | null;
  hero_image_url: string | null;
  event_date: string;
  registration_opens_at: string | null;
  registration_deadline: string | null;
  arrival_time: string | null;
  first_tee_time: string | null;
  shotgun_time: string | null;
  format: CompetitionFormat | null;
  max_players: number | null;
  member_price: number | null;
  guest_price: number | null;
  description: string | null;
  competition_rules: string | null;
  prizes: string | null;
  dress_code: string | null;
  course_information: string | null;
  handicap_allowance: string | null;
  oom_eligible: boolean;
  oom_multiplier: number;
  is_major: boolean;
  sponsor_id: string | null;
  status: EventStatus;
  results_published: boolean;
  results_published_at: string | null;
  golf_clubs?: GolfClub | null;
  courses?: Course | null;
}

export interface EventCapacity {
  event_id: string;
  max_players: number | null;
  players_entered: number;
  spaces_remaining: number | null;
  waiting_list_count: number;
}

export interface EventEntry {
  id: string;
  event_id: string;
  member_id: string;
  entry_date: string;
  playing_handicap: number | null;
  is_guest: boolean;
  guest_name: string | null;
  status: EntryStatus;
  withdrawn_at: string | null;
  payment_required: boolean;
  payment_amount: number | null;
  payment_status: PaymentStatus;
  agreed_to_rules: boolean;
}

export interface WaitingListEntry {
  id: string;
  event_id: string;
  member_id: string;
  position: number;
  status: WaitingListStatus;
  joined_at: string;
}

export interface EventResult {
  id: string;
  event_id: string;
  member_id: string;
  position: number;
  position_display: string;
  oom_points: number;
  published: boolean;
  member_profiles?: Pick<MemberProfile, "first_name" | "last_name" | "avatar_url">;
  event_scores?: {
    playing_handicap: number | null;
    gross_score: number | null;
    nett_score: number | null;
    stableford_points: number | null;
  } | null;
}

export interface OrderOfMeritPoint {
  id: string;
  season_id: string;
  member_id: string;
  total_points: number;
  counting_points: number;
  dropped_points: number;
  adjustment_points: number;
  events_played: number;
  wins: number;
  runner_ups: number;
  top3: number;
  top10: number;
  rank: number | null;
  previous_rank: number | null;
  member_profiles?: Pick<MemberProfile, "first_name" | "last_name" | "avatar_url" | "current_handicap">;
}

export interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  sponsor_level: SponsorLevel;
  display_order: number;
  active: boolean;
}

export interface EventPhoto {
  id: string;
  event_id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
  url: string;
}

export interface PlayerDirectoryEntry {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  current_handicap: number | null;
  industry: string | null;
  company: string | null;
  job_title: string | null;
  home_golf_club: string | null;
  mobile: string | null;
  email: string | null;
  tour_rank: number | null;
  oom_points: number | null;
}

export const INDUSTRY_OPTIONS = [
  "Banking",
  "Investment Banking",
  "Investment Management",
  "Asset Management",
  "Hedge Fund",
  "Private Equity",
  "Venture Capital",
  "Family Office",
  "Trading",
  "Quantitative Trading",
  "Crypto",
  "Digital Assets",
  "Blockchain",
  "FinTech",
  "Payments",
  "Brokerage",
  "Professional Services",
  "Technology",
  "Recruitment",
  "Other",
] as const;
