import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import { GetLeaderboardQueryParams, GetLeaderboardResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit } = parsed.data;

  const players = await db
    .select()
    .from(playersTable)
    .orderBy(desc(playersTable.level), desc(playersTable.gold))
    .limit(limit ?? 20);

  const entries = players.map((p, idx) => ({
    rank: idx + 1,
    username: p.username,
    level: p.level,
    gold: p.gold,
    hero_type: p.heroType ?? null,
  }));

  res.json(GetLeaderboardResponse.parse(entries));
});

export default router;
