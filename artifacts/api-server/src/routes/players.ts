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
// ============================================
// أضف هذا الكود في نهاية ملف:
// artifacts/api-server/src/routes/players.ts
// قبل سطر: export default router;
// ============================================

// ---- ترقية نجوم البطل ----
router.patch("/players/me/hero-stars", async (req, res): Promise<void> => {
  const qParsed = UpgradeSkillQueryParams.safeParse(req.query); // نفس schema موجود
  if (!qParsed.success) { res.status(400).json({ error: qParsed.error.message }); return; }

  const [current] = await db.select().from(playersTable)
    .where(eq(playersTable.telegramId, qParsed.data.telegram_id)).limit(1);

  if (!current) { res.status(404).json({ error: "Player not found" }); return; }

  const currentStars = current.heroStars ?? 1;
  if (currentStars >= 5) {
    res.status(400).json({ error: "البطل وصل الحد الأقصى للنجوم (5★)" }); return;
  }

  const STAR_COST: Record<number, { gold: number; fragments: number }> = {
    2: { gold: 500,   fragments: 10  },
    3: { gold: 2000,  fragments: 20  },
    4: { gold: 8000,  fragments: 50  },
    5: { gold: 30000, fragments: 100 },
  };

  const cost = STAR_COST[currentStars + 1];
  const fragments = current.heroFragments ?? 0;

  if (current.gold < cost.gold) {
    res.status(400).json({ error: `تحتاج ${cost.gold.toLocaleString()} ذهب` }); return;
  }
  if (fragments < cost.fragments) {
    res.status(400).json({ error: `تحتاج ${cost.fragments} شظية (لديك ${fragments})` }); return;
  }

  const [player] = await db.update(playersTable).set({
    heroStars: currentStars + 1,
    gold: current.gold - cost.gold,
    heroFragments: fragments - cost.fragments,
  }).where(eq(playersTable.id, current.id)).returning();

  res.json({ success: true, message: `⭐ تمت الترقية إلى ${currentStars + 1}★!`, player: serializePlayer(player) });
});

// ---- ترقية مهارة البطل (محسّنة) ----
router.patch("/players/me/hero-skill", async (req, res): Promise<void> => {
  const qParsed = UpgradeSkillQueryParams.safeParse(req.query);
  if (!qParsed.success) { res.status(400).json({ error: qParsed.error.message }); return; }

  const [current] = await db.select().from(playersTable)
    .where(eq(playersTable.telegramId, qParsed.data.telegram_id)).limit(1);

  if (!current) { res.status(404).json({ error: "Player not found" }); return; }

  const skillLevel = current.heroSkillLevel ?? 1;
  if (skillLevel >= 10) {
    res.status(400).json({ error: "المهارة وصلت الحد الأقصى (10)!" }); return;
  }

  const skillBooks = current.skillBooks ?? 0;
  const cost = skillLevel * 5; // 5, 10, 15...

  if (skillBooks < cost) {
    res.status(400).json({ error: `تحتاج ${cost} كتاب مهارات (لديك ${skillBooks})` }); return;
  }

  const [player] = await db.update(playersTable).set({
    heroSkillLevel: skillLevel + 1,
    skillBooks: skillBooks - cost,
  }).where(eq(playersTable.id, current.id)).returning();

  res.json({ success: true, message: `📚 المهارة ارتقت إلى المستوى ${skillLevel + 1}!`, player: serializePlayer(player) });
});

// ---- صعود البطل ----
router.patch("/players/me/hero-ascend", async (req, res): Promise<void> => {
  const qParsed = UpgradeSkillQueryParams.safeParse(req.query);
  if (!qParsed.success) { res.status(400).json({ error: qParsed.error.message }); return; }

  const [current] = await db.select().from(playersTable)
    .where(eq(playersTable.telegramId, qParsed.data.telegram_id)).limit(1);

  if (!current) { res.status(404).json({ error: "Player not found" }); return; }

  const ascension = current.heroAscension ?? 0;
  if (ascension >= 6) {
    res.status(400).json({ error: "وصل البطل للحد الأقصى من الصعود!" }); return;
  }

  const maxLevel = 20 * (current.heroStars ?? 1);
  if (current.heroLevel < maxLevel) {
    res.status(400).json({ error: `يجب أن يكون البطل في المستوى ${maxLevel} للصعود` }); return;
  }

  const goldCost  = Math.floor(5000 * Math.pow(2, ascension));
  const stoneCost = ascension + 1;
  const stones    = current.ascensionStones ?? 0;

  if (current.gold < goldCost) {
    res.status(400).json({ error: `تحتاج ${goldCost.toLocaleString()} ذهب` }); return;
  }
  if (stones < stoneCost) {
    res.status(400).json({ error: `تحتاج ${stoneCost} حجر صعود (لديك ${stones})` }); return;
  }

  const [player] = await db.update(playersTable).set({
    heroAscension: ascension + 1,
    gold: current.gold - goldCost,
    ascensionStones: stones - stoneCost,
  }).where(eq(playersTable.id, current.id)).returning();

  res.json({ success: true, message: `🔥 صعد البطل إلى مستوى الصعود ${ascension + 1}!`, player: serializePlayer(player) });
});

export default router;
