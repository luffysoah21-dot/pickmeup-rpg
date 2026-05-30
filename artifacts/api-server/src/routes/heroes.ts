// ============================================
// API Routes للأبطال - heroes.ts
// المسار: artifacts/api-server/src/routes/heroes.ts
// ============================================

import { Router } from "express";
import { z } from "zod";
import { addExp, upgradeStar, upgradeSkill, ascendHero, calculateStats } from "../lib/heroUpgrade";
import type { Hero, PlayerResources } from "../../../../lib/types/hero";

const router = Router();

// ---- بيانات مؤقتة (استبدلها بقاعدة بيانات) ----
// في مشروعك الحقيقي استخدم database أو Telegram CloudStorage

const mockHero: Hero = {
  id: "hero_001",
  name: "ليلى الصياد",
  class: "archer",
  rarity: 3,
  level: 1,
  maxLevel: 60,
  exp: 0,
  expToNextLevel: 100,
  stars: 3,
  ascensionLevel: 0,
  baseStats: { hp: 800, attack: 90, defense: 40, speed: 60, critRate: 10, critDamage: 150 },
  currentStats: { hp: 800, attack: 90, defense: 40, speed: 60, critRate: 10, critDamage: 150 },
  skills: [
    { id: "skill_001", name: "سهم النار", description: "يطلق سهماً نارياً", level: 1, maxLevel: 10, damage: 200, cooldown: 3, upgradeCost: 5 },
    { id: "skill_002", name: "المطر من السهام", description: "وابل من السهام", level: 1, maxLevel: 10, damage: 150, cooldown: 8, upgradeCost: 8 },
  ],
  equipment: {},
  fragments: 0,
};

const mockResources: PlayerResources = {
  gold: 10000,
  gems: 500,
  heroFragments: { hero_001: 30 },
  skillBooks: 50,
  ascensionStones: 5,
};

// ---- GET /api/heroes/:id ----
router.get("/:id", (req, res) => {
  const hero = mockHero; // استبدل بـ DB query
  hero.currentStats = calculateStats(hero);
  res.json({ hero });
});

// ---- GET /api/heroes/:id/resources ----
router.get("/:id/resources", (req, res) => {
  res.json({ resources: mockResources });
});

// ---- POST /api/heroes/:id/add-exp ----
const addExpSchema = z.object({ expAmount: z.number().positive() });

router.post("/:id/add-exp", (req, res) => {
  const parsed = addExpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "expAmount مطلوب وموجب" });
    return;
  }
  const result = addExp(mockHero, parsed.data.expAmount, mockResources);
  res.json(result);
});

// ---- POST /api/heroes/:id/upgrade-star ----
router.post("/:id/upgrade-star", (req, res) => {
  const result = upgradeStar(mockHero, mockResources);
  res.json(result);
});

// ---- POST /api/heroes/:id/upgrade-skill ----
const upgradeSkillSchema = z.object({ skillId: z.string() });

router.post("/:id/upgrade-skill", (req, res) => {
  const parsed = upgradeSkillSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "skillId مطلوب" });
    return;
  }
  const result = upgradeSkill(mockHero, parsed.data.skillId, mockResources);
  res.json(result);
});

// ---- POST /api/heroes/:id/ascend ----
router.post("/:id/ascend", (req, res) => {
  const result = ascendHero(mockHero, mockResources);
  res.json(result);
});

export default router;
