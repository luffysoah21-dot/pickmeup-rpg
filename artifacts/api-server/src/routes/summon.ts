import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import { PerformSummonBody } from "@workspace/api-zod";
import { serializePlayer } from "../lib/player-serializer";

const router: IRouter = Router();

const SUMMON_POOL = {
  common:    ["warrior", "mage", "assassin"],
  rare:      ["executioner", "shaman"],
  epic:      ["dark_knight"],
  legendary: ["thunder_goddess"],
} as const;

const SUMMON_COSTS = { normal: 100, premium: 500, x10: 900 } as const;

type Rarity = "common" | "rare" | "epic" | "legendary";

function rollRarity(pityEpic: number, pityLegendary: number, guaranteeRare = false): Rarity {
  if (pityLegendary >= 49) return "legendary";
  if (pityEpic >= 9)       return "epic";
  const r = Math.random();
  if (r < 0.03)            return "legendary";
  if (r < 0.15)            return "epic";
  if (guaranteeRare || r < 0.40) return "rare";
  return "common";
}

function pickHero(rarity: Rarity): string {
  const pool = SUMMON_POOL[rarity] as readonly string[];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

interface SummonOutput { heroType: string; rarity: Rarity; isNew: boolean }

function doSummons(
  count: number,
  pityEpic: number,
  pityLegendary: number,
  guaranteeRare = false,
  guaranteeEpic = false,
  alreadyOwned: string[],
): { results: SummonOutput[]; pityEpic: number; pityLegendary: number } {
  const results: SummonOutput[] = [];
  let pe = pityEpic;
  let pl = pityLegendary;
  let hasEpicOrBetter = false;
  const nowOwned = new Set(alreadyOwned);

  for (let i = 0; i < count; i++) {
    // Force epic on last x10 roll if none appeared
    const forceEpic = guaranteeEpic && i === count - 1 && !hasEpicOrBetter;
    let rarity: Rarity;
    if (forceEpic) {
      rarity = pl >= 49 ? "legendary" : "epic";
    } else {
      rarity = rollRarity(pe, pl, guaranteeRare && i === 0);
    }

    if (rarity === "legendary") { pe = 0; pl = 0; }
    else if (rarity === "epic") { pe = 0; pl++; }
    else { pe++; pl++; }

    if (rarity === "epic" || rarity === "legendary") hasEpicOrBetter = true;

    const heroType = pickHero(rarity);
    const isNew = !nowOwned.has(heroType);
    nowOwned.add(heroType);
    results.push({ heroType, rarity, isNew });
  }

  return { results, pityEpic: pe, pityLegendary: pl };
}

router.post("/summon", async (req, res): Promise<void> => {
  const parsed = PerformSummonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { telegram_id, summon_type } = parsed.data;
  const cost = SUMMON_COSTS[summon_type];

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.telegramId, telegram_id))
    .limit(1);

  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  if (player.gold < cost) {
    res.status(400).json({ error: "Not enough gold" });
    return;
  }

  const alreadyOwned = player.ownedHeroes ? player.ownedHeroes.split(",").filter(Boolean) : [];
  const count         = summon_type === "x10" ? 10 : 1;
  const guaranteeRare = summon_type === "premium";
  const guaranteeEpic = summon_type === "x10";

  const { results, pityEpic, pityLegendary } = doSummons(
    count,
    player.pityEpic,
    player.pityLegendary,
    guaranteeRare,
    guaranteeEpic,
    alreadyOwned,
  );

  // Merge newly obtained heroes into ownedHeroes
  const allOwned = new Set(alreadyOwned);
  for (const r of results) allOwned.add(r.heroType);
  const ownedHeroes = [...allOwned].join(",");

  const [updated] = await db
    .update(playersTable)
    .set({ gold: player.gold - cost, pityEpic, pityLegendary, ownedHeroes })
    .where(eq(playersTable.id, player.id))
    .returning();

  res.json({
    summoned: results.map(r => ({ hero_type: r.heroType, rarity: r.rarity, is_new: r.isNew })),
    player: serializePlayer(updated!),
  });
});

export default router;
