export interface AchievementBadge {
  emoji: string;
  label: string;
}

export interface BadgeInput {
  rank: number | null;
  wins: number;
  top3: number;
  top10: number;
  eventsPlayed: number;
}

// Shared between the player profile page and the Order of Merit table so
// the two never drift out of sync.
export function getAchievementBadges(player: BadgeInput, seasonEventsPlayed: number): AchievementBadge[] {
  const badges: AchievementBadge[] = [];

  if (player.rank === 1) badges.push({ emoji: "\u{1F3C6}", label: "Leader" });
  if (player.wins >= 1) badges.push({ emoji: "\u{1F947}", label: "Winner" });

  if (player.top3 >= 1) {
    badges.push({ emoji: "\u{1F949}", label: "Top 3 Finish" });
  } else if (player.top10 >= 1) {
    badges.push({ emoji: "\u{1F51F}", label: "Top 10 Finish" });
  }

  if (seasonEventsPlayed > 0 && player.eventsPlayed >= seasonEventsPlayed) {
    badges.push({ emoji: "\u{1F4AA}", label: "TPT Veteran" });
  }

  return badges;
}
