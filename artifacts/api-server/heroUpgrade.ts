// ============================================
// منطق تطوير الأبطال - heroUpgrade.ts
// المسار: artifacts/api-server/src/lib/heroUpgrade.ts
// ============================================

import type {
  Hero,
  HeroStats,
  HeroSkill,
  Rarity,
  UpgradeResult,
  PlayerResources,
} from "../../../../lib/types/hero";

// ---- ثوابت اللعبة ----

const EXP_PER_LEVEL = (level: number) => Math.floor(100 * Math.pow(1.15, level));

const STAT_GROWTH: Record<string, Record<string, number>> = {
  warrior:  { hp: 120, attack: 8,  defense: 6,  speed: 3, critRate: 0.5, critDamage: 1 },
  mage:     { hp: 80,  attack: 14, defense: 3,  speed: 4, critRate: 1,   critDamage: 2 },
  archer:   { hp: 90,  attack: 12, defense: 4,  speed: 6, critRate: 1.5, critDamage: 1.5 },
  healer:   { hp: 100, attack: 5,  defense: 5,  speed: 5, critRate: 0.3, critDamage: 1 },
  assassin: { hp: 75,  attack: 15, defense: 2,  speed: 8, critRate: 2,   critDamage: 3 },
};

const STAR_UPGRADE_COST: Record<number, { gold: number; fragments: number }> = {
  2: { gold: 500,   fragments: 10  },
  3: { gold: 2000,  fragments: 20  },
  4: { gold: 8000,  fragments: 50  },
  5: { gold: 30000, fragments: 100 },
};

const ASCENSION_COST = (level: number) => ({
  gold: Math.floor(5000 * Math.pow(2, level)),
  ascensionStones: level + 1,
});

// ---- دوال الحساب ----

export function calculateStats(hero: Hero): HeroStats {
  const growth = STAT_GROWTH[hero.class];
  const starMultiplier = 1 + (hero.stars - 1) * 0.15;
  const ascMultiplier  = 1 + hero.ascensionLevel * 0.10;
  const lvl = hero.level;

  const base: HeroStats = {
    hp:         Math.floor((hero.baseStats.hp         + growth.hp         * lvl) * starMultiplier * ascMultiplier),
    attack:     Math.floor((hero.baseStats.attack     + growth.attack     * lvl) * starMultiplier * ascMultiplier),
    defense:    Math.floor((hero.baseStats.defense    + growth.defense    * lvl) * starMultiplier * ascMultiplier),
    speed:      Math.floor((hero.baseStats.speed      + growth.speed      * lvl) * starMultiplier * ascMultiplier),
    critRate:   Math.min(100, hero.baseStats.critRate   + growth.critRate   * lvl),
    critDamage: hero.baseStats.critDamage + growth.critDamage * lvl,
  };

  // أضف بونص المعدات
  const eq = hero.equipment;
  for (const slot of [eq.weapon, eq.armor, eq.accessory]) {
    if (!slot) continue;
    for (const [key, val] of Object.entries(slot.statBonus)) {
      (base as Record<string, number>)[key] += val as number;
    }
  }

  return base;
}

// ---- Level Up ----

export function addExp(
  hero: Hero,
  expGained: number,
  resources: PlayerResources
): UpgradeResult {
  if (hero.level >= hero.maxLevel) {
    return { success: false, hero, message: "البطل وصل الحد الأقصى للمستوى! قم بترقية النجوم أولاً." };
  }

  hero.exp += expGained;
  let leveledUp = false;
  let levelsGained = 0;

  while (hero.exp >= hero.expToNextLevel && hero.level < hero.maxLevel) {
    hero.exp -= hero.expToNextLevel;
    hero.level += 1;
    levelsGained++;
    hero.expToNextLevel = EXP_PER_LEVEL(hero.level);
    leveledUp = true;
  }

  if (hero.level >= hero.maxLevel) hero.exp = 0;

  const oldStats = { ...hero.currentStats };
  hero.currentStats = calculateStats(hero);

  const statGains: Partial<HeroStats> = {};
  for (const key of Object.keys(oldStats) as (keyof HeroStats)[]) {
    const gain = hero.currentStats[key] - oldStats[key];
    if (gain > 0) statGains[key] = gain;
  }

  return {
    success: true,
    hero,
    message: leveledUp
      ? `🎉 ارتقى ${hero.name} إلى المستوى ${hero.level}!`
      : `✨ حصل ${hero.name} على ${expGained} EXP`,
    leveledUp,
    newLevel: hero.level,
    statGains,
  };
}

// ---- ترقية النجوم ----

export function upgradeStar(
  hero: Hero,
  resources: PlayerResources
): UpgradeResult {
  if (hero.stars >= 5) {
    return { success: false, hero, message: "البطل وصل الحد الأقصى للنجوم (5★)!" };
  }

  const nextStar = (hero.stars + 1) as Rarity;
  const cost = STAR_UPGRADE_COST[nextStar];
  const heroFragments = resources.heroFragments[hero.id] ?? 0;

  if (resources.gold < cost.gold) {
    return { success: false, hero, message: `تحتاج ${cost.gold.toLocaleString()} ذهب (لديك ${resources.gold.toLocaleString()})` };
  }
  if (heroFragments < cost.fragments) {
    return { success: false, hero, message: `تحتاج ${cost.fragments} شظية (لديك ${heroFragments})` };
  }

  // اخصم الموارد
  resources.gold -= cost.gold;
  resources.heroFragments[hero.id] = heroFragments - cost.fragments;

  hero.stars = nextStar;
  hero.maxLevel = 20 * hero.stars; // كل نجمة تفتح 20 مستوى إضافي
  hero.currentStats = calculateStats(hero);

  return {
    success: true,
    hero,
    message: `⭐ تمت ترقية ${hero.name} إلى ${hero.stars}★!`,
  };
}

// ---- تطوير المهارات ----

export function upgradeSkill(
  hero: Hero,
  skillId: string,
  resources: PlayerResources
): UpgradeResult {
  const skill = hero.skills.find((s) => s.id === skillId);
  if (!skill) {
    return { success: false, hero, message: "المهارة غير موجودة" };
  }
  if (skill.level >= skill.maxLevel) {
    return { success: false, hero, message: `المهارة "${skill.name}" وصلت الحد الأقصى!` };
  }

  const cost = skill.upgradeCost * skill.level;
  if (resources.skillBooks < cost) {
    return { success: false, hero, message: `تحتاج ${cost} كتاب مهارات (لديك ${resources.skillBooks})` };
  }

  resources.skillBooks -= cost;
  skill.level += 1;
  if (skill.damage)     skill.damage     = Math.floor(skill.damage     * 1.12);
  if (skill.healAmount) skill.healAmount = Math.floor(skill.healAmount * 1.10);
  skill.cooldown = Math.max(1, skill.cooldown - 0.2);

  return {
    success: true,
    hero,
    message: `📚 تمت ترقية "${skill.name}" إلى المستوى ${skill.level}!`,
  };
}

// ---- الصعود (Ascension) ----

export function ascendHero(
  hero: Hero,
  resources: PlayerResources
): UpgradeResult {
  if (hero.ascensionLevel >= 6) {
    return { success: false, hero, message: "وصل البطل للحد الأقصى من الصعود!" };
  }
  if (hero.level < hero.maxLevel) {
    return { success: false, hero, message: `يجب أن يكون البطل في المستوى ${hero.maxLevel} للصعود` };
  }

  const cost = ASCENSION_COST(hero.ascensionLevel);
  if (resources.gold < cost.gold) {
    return { success: false, hero, message: `تحتاج ${cost.gold.toLocaleString()} ذهب` };
  }
  if (resources.ascensionStones < cost.ascensionStones) {
    return { success: false, hero, message: `تحتاج ${cost.ascensionStones} حجر صعود` };
  }

  resources.gold -= cost.gold;
  resources.ascensionStones -= cost.ascensionStones;
  hero.ascensionLevel += 1;
  hero.currentStats = calculateStats(hero);

  return {
    success: true,
    hero,
    message: `🔥 صعد ${hero.name} إلى مستوى الصعود ${hero.ascensionLevel}!`,
  };
}
