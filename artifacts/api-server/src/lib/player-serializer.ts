import type { Player } from "@workspace/db";

/** EXP needed to advance FROM current level. level * 100 */
const EXP_TO_NEXT = (level: number) => level * 100;

export function serializePlayer(player: Player) {
  const owned = player.ownedHeroes
    ? player.ownedHeroes.split(",").filter(Boolean)
    : [];
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
    owned_heroes: owned,
    pity_epic: player.pityEpic,
    pity_legendary: player.pityLegendary,
  };
}
