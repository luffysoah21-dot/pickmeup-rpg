import type { Player } from "@workspace/db";

/** EXP needed to advance FROM current level. Formula: level * 100 (level 1→100, level 2→200, …) */
const EXP_TO_NEXT = (level: number) => level * 100;

export function serializePlayer(player: Player) {
  return {
    id: player.id,
    telegram_id: player.telegramId,
    username: player.username,
    level: player.level,
    exp: player.exp,
    exp_to_next: EXP_TO_NEXT(player.level),
    gold: player.gold,
    hero_type: player.heroType ?? null,
    hero_level: player.heroLevel,
  };
}
