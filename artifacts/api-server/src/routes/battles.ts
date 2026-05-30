import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, playersTable, battlesTable } from "@workspace/db";
import {
  RecordBattleBody,
  GetBattleHistoryQueryParams,
  GetBattleHistoryResponse,
} from "@workspace/api-zod";
import { serializePlayer } from "../lib/player-serializer";

const router: IRouter = Router();

/** EXP required to advance FROM this level. Simple linear: level * 100. */
const EXP_PER_LEVEL = (level: number) => level * 100;

function serializeBattle(b: { id: number; playerId: number; monsterName: string; result: string; expGained: number; goldGained: number; createdAt: Date }) {
  return {
    id: b.id,
    player_id: b.playerId,
    monster_name: b.monsterName,
    result: b.result,
    exp_gained: b.expGained,
    gold_gained: b.goldGained,
    created_at: b.createdAt.toISOString(),
  };
}

router.post("/battles", async (req, res): Promise<void> => {
  const parsed = RecordBattleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { telegram_id, monster_name, result, exp_gained, gold_gained } = parsed.data;

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.telegramId, telegram_id))
    .limit(1);

  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const [battle] = await db
    .insert(battlesTable)
    .values({
      playerId: player.id,
      monsterName: monster_name,
      result,
      expGained: exp_gained,
      goldGained: gold_gained,
    })
    .returning();

  let updatedPlayer = player;
  if (result === "win") {
    let newExp = player.exp + exp_gained;
    let newLevel = player.level;
    let newGold = player.gold + gold_gained;

    while (newLevel < 50 && newExp >= EXP_PER_LEVEL(newLevel)) {
      newExp -= EXP_PER_LEVEL(newLevel);
      newLevel++;
    }

    [updatedPlayer] = await db
      .update(playersTable)
      .set({ exp: newExp, level: newLevel, gold: newGold })
      .where(eq(playersTable.id, player.id))
      .returning();
  }

  res.status(201).json({
    battle: serializeBattle(battle),
    player: serializePlayer(updatedPlayer),
  });
});

router.get("/battles/history", async (req, res): Promise<void> => {
  const parsed = GetBattleHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { telegram_id, limit } = parsed.data;

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.telegramId, telegram_id))
    .limit(1);

  if (!player) {
    res.json([]);
    return;
  }

  const battles = await db
    .select()
    .from(battlesTable)
    .where(eq(battlesTable.playerId, player.id))
    .orderBy(desc(battlesTable.createdAt))
    .limit(limit ?? 10);

  res.json(GetBattleHistoryResponse.parse(battles.map(serializeBattle)));
});

export default router;
