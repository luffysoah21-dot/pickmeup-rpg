import type { Player } from "@workspace/db";

const EXP_PER_LEVEL = (level: number) => Math.floor(100 * Math.pow(1.4, level - 1));

export function serializePlayer(player: Player) {
  return {
    id: player.id,
    telegram_id: player.telegramId,
    username: player.username,
    level: player.level,
    exp: player.exp,
    exp_to_next: EXP_PER_LEVEL(player.level),
    gold: player.gold,
    hero_type: player.heroType ?? null,
    hero_level: player.heroLevel,
  };
}
