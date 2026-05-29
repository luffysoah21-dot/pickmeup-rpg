import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import {
  GetPlayerQueryParams,
  GetPlayerResponse,
  SelectHeroQueryParams,
  SelectHeroBody,
  SelectHeroResponse,
  UpgradeSkillQueryParams,
  UpgradeSkillResponse,
} from "@workspace/api-zod";
import { serializePlayer } from "../lib/player-serializer";

const router: IRouter = Router();

router.get("/players/me", async (req, res): Promise<void> => {
  const parsed = GetPlayerQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { telegram_id, username } = parsed.data;

  let [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.telegramId, telegram_id))
    .limit(1);

  if (!player) {
    [player] = await db
      .insert(playersTable)
      .values({ telegramId: telegram_id, username: username ?? "Player" })
      .returning();
  } else if (username && player.username !== username) {
    [player] = await db
      .update(playersTable)
      .set({ username })
      .where(eq(playersTable.id, player.id))
      .returning();
  }

  res.json(GetPlayerResponse.parse(serializePlayer(player)));
});

router.patch("/players/me/hero", async (req, res): Promise<void> => {
  const qParsed = SelectHeroQueryParams.safeParse(req.query);
  if (!qParsed.success) {
    res.status(400).json({ error: qParsed.error.message });
    return;
  }
  const bParsed = SelectHeroBody.safeParse(req.body);
  if (!bParsed.success) {
    res.status(400).json({ error: bParsed.error.message });
    return;
  }

  const [player] = await db
    .update(playersTable)
    .set({ heroType: bParsed.data.hero_type, heroLevel: 1 })
    .where(eq(playersTable.telegramId, qParsed.data.telegram_id))
    .returning();

  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  res.json(SelectHeroResponse.parse(serializePlayer(player)));
});

router.patch("/players/me/skill", async (req, res): Promise<void> => {
  const qParsed = UpgradeSkillQueryParams.safeParse(req.query);
  if (!qParsed.success) {
    res.status(400).json({ error: qParsed.error.message });
    return;
  }

  const [current] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.telegramId, qParsed.data.telegram_id))
    .limit(1);

  if (!current) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const upgradeCost = current.heroLevel * 100;
  if (current.gold < upgradeCost) {
    res.status(400).json({ error: "Not enough gold" });
    return;
  }

  const [player] = await db
    .update(playersTable)
    .set({ heroLevel: current.heroLevel + 1, gold: current.gold - upgradeCost })
    .where(eq(playersTable.id, current.id))
    .returning();

  res.json(UpgradeSkillResponse.parse(serializePlayer(player)));
});

export default router;
