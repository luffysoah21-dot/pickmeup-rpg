// ============================================
// أنواع نظام الأبطال - hero.ts
// المسار: lib/types/hero.ts  (مشترك بين frontend و backend)
// ============================================

export type Rarity = 1 | 2 | 3 | 4 | 5; // ⭐ عدد النجوم

export type HeroClass = "warrior" | "mage" | "archer" | "healer" | "assassin";

export interface HeroSkill {
  id: string;
  name: string;
  description: string;
  level: number;        // 1 - 10
  maxLevel: number;
  damage?: number;
  healAmount?: number;
  cooldown: number;     // بالثواني
  upgradeCost: number;  // تكلفة ترقية المهارة
}

export interface HeroEquipment {
  weapon?: EquipmentItem;
  armor?: EquipmentItem;
  accessory?: EquipmentItem;
}

export interface EquipmentItem {
  id: string;
  name: string;
  rarity: Rarity;
  statBonus: Partial<HeroStats>;
}

export interface HeroStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;    // نسبة الضربة الحاسمة (0-100)
  critDamage: number;  // مضاعف الضربة الحاسمة
}

export interface Hero {
  id: string;
  name: string;
  class: HeroClass;
  rarity: Rarity;
  level: number;       // 1 - 100
  maxLevel: number;    // يزيد مع الترقية بالنجوم
  exp: number;
  expToNextLevel: number;
  stars: Rarity;       // عدد النجوم الحالي (يمكن ترقيته)
  ascensionLevel: number; // مستوى الصعود 0-6
  baseStats: HeroStats;
  currentStats: HeroStats; // بعد المعدات والمهارات
  skills: HeroSkill[];
  equipment: HeroEquipment;
  fragments: number;   // شظايا البطل للاستدعاء
}

export interface UpgradeResult {
  success: boolean;
  hero: Hero;
  message: string;
  leveledUp?: boolean;
  newLevel?: number;
  statGains?: Partial<HeroStats>;
}

export interface PlayerResources {
  gold: number;
  gems: number;
  heroFragments: Record<string, number>; // heroId -> عدد الشظايا
  skillBooks: number;
  ascensionStones: number;
}
