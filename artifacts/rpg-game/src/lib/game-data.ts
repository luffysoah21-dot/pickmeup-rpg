/* ═══════════════════════════════════════════════════════════
   Shared Game Data — heroes, floors, summon pool
   ═══════════════════════════════════════════════════════════ */

export type HeroRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface HeroDef {
  type: string;
  name: string;
  emoji: string;
  hp: number;
  atk: number;
  def: number;
  skill: string;
  skillDesc: string;
  rarity: HeroRarity;
  unlockLevel: number;
  desc: string;
  glowColor: string;
}

export const ALL_HEROES: HeroDef[] = [
  // ── Common (starter) ──────────────────────────────────────
  {
    type: 'warrior',
    name: 'المحارب',
    emoji: '⚔️',
    hp: 1000, atk: 150, def: 80,
    skill: 'ضربة السيف',
    skillDesc: 'ضربة قوية بالسيف',
    rarity: 'common',
    unlockLevel: 1,
    desc: 'فارس مدرّع بدرجة عالية. متانة قصوى وقدرة دفاعية فائقة.',
    glowColor: '#f0c040',
  },
  {
    type: 'mage',
    name: 'الساحر',
    emoji: '🔮',
    hp: 700, atk: 220, def: 40,
    skill: 'كرة النار',
    skillDesc: 'إطلاق كرة نارية مدمّرة',
    rarity: 'common',
    unlockLevel: 1,
    desc: 'ساحر غامض يُطلق قوى أركانية مدمّرة.',
    glowColor: '#60a5fa',
  },
  {
    type: 'assassin',
    name: 'المُحتال',
    emoji: '🗡️',
    hp: 800, atk: 200, def: 50,
    skill: 'ضربة الظل',
    skillDesc: 'ضربة من الظلام لا تُرى',
    rarity: 'common',
    unlockLevel: 1,
    desc: 'لص الظلام. يضرب بسرعة خاطفة ويختفي قبل أن يُرى.',
    glowColor: '#ef4444',
  },
  // ── Rare ──────────────────────────────────────────────────
  {
    type: 'executioner',
    name: 'الجلاد',
    emoji: '🪓',
    hp: 1200, atk: 180, def: 100,
    skill: 'ضربة الإعدام',
    skillDesc: 'يتضاعف الضرر إذا HP العدو أقل من 30%',
    rarity: 'rare',
    unlockLevel: 10,
    desc: 'جلاد لا يرحم، ضربته الأخيرة لا تُخطئ.',
    glowColor: '#3b82f6',
  },
  {
    type: 'shaman',
    name: 'الشامان',
    emoji: '🌿',
    hp: 900, atk: 160, def: 70,
    skill: 'روح الطبيعة',
    skillDesc: 'يشفي 30% HP ويُلحق ضرراً بالعدو',
    rarity: 'rare',
    unlockLevel: 15,
    desc: 'يستمد قوته من الأرض والسماء.',
    glowColor: '#22c55e',
  },
  // ── Epic ──────────────────────────────────────────────────
  {
    type: 'dark_knight',
    name: 'الفارس الأسود',
    emoji: '🌑',
    hp: 1500, atk: 250, def: 120,
    skill: 'اندفاع الظلام',
    skillDesc: 'يسرق HP من العدو ويستعيده',
    rarity: 'epic',
    unlockLevel: 25,
    desc: 'من قاتل الظلام حتى أصبح منه.',
    glowColor: '#a855f7',
  },
  // ── Legendary ─────────────────────────────────────────────
  {
    type: 'thunder_goddess',
    name: 'إلهة الرعد',
    emoji: '⚡',
    hp: 1100, atk: 350, def: 80,
    skill: 'صاعقة الآلهة',
    skillDesc: 'صاعقة إلهية تتجاهل الدفاع',
    rarity: 'legendary',
    unlockLevel: 40,
    desc: 'غضبها رعد، ورحمتها أشد.',
    glowColor: '#fbbf24',
  },
];

export const STARTER_HEROES = ['warrior', 'mage', 'assassin'];

export const RARITY_COLORS: Record<HeroRarity, { border: string; glow: string; label: string; stars: string }> = {
  common:    { border: '#6b7280', glow: 'rgba(107,114,128,0.4)', label: 'شائع',  stars: '⭐'       },
  rare:      { border: '#3b82f6', glow: 'rgba(59,130,246,0.6)', label: 'نادر',  stars: '⭐⭐'     },
  epic:      { border: '#a855f7', glow: 'rgba(168,85,247,0.7)', label: 'ملحمي', stars: '⭐⭐⭐'   },
  legendary: { border: '#f59e0b', glow: 'rgba(245,158,11,0.9)', label: 'أسطوري',stars: '⭐⭐⭐⭐' },
};

/* ── Tower Floors ──────────────────────────────────────────── */

export interface MonsterDef {
  name: string;
  arName: string;
  emoji: string;
  hp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
  isBoss: boolean;
}

export interface FloorDef {
  id: number;
  name: string;
  emoji: string;
  levelReq: number;
  levelMax: number;
  bgFrom: string;
  bgTo: string;
  borderColor: string;
  glowColor: string;
  monsters: MonsterDef[];
  bossTitle: string;
}

export const TOWER_FLOORS: FloorDef[] = [
  {
    id: 1,
    name: 'غابة الظلام',
    emoji: '🌑',
    levelReq: 1,
    levelMax: 5,
    bgFrom: '#0a1f0a',
    bgTo: '#000',
    borderColor: '#166534',
    glowColor: 'rgba(22,101,52,0.6)',
    bossTitle: 'ملك الطابق الأول',
    monsters: [
      { name: 'BlackSlime',  arName: 'الوحل الأسود',  emoji: '🖤', hp: 300,  atk: 45,  def: 10, exp: 25,  gold: 12,  isBoss: false },
      { name: 'HungryWolf',  arName: 'الذئب الجائع',  emoji: '🐺', hp: 450,  atk: 70,  def: 15, exp: 40,  gold: 20,  isBoss: false },
      { name: 'WolfKing',    arName: 'ملك الذئاب',    emoji: '👑', hp: 1200, atk: 120, def: 30, exp: 150, gold: 80,  isBoss: true  },
    ],
  },
  {
    id: 2,
    name: 'كهف الجليد',
    emoji: '❄️',
    levelReq: 6,
    levelMax: 15,
    bgFrom: '#050e2d',
    bgTo: '#000',
    borderColor: '#1d4ed8',
    glowColor: 'rgba(29,78,216,0.6)',
    bossTitle: 'ملكة الطابق الثاني',
    monsters: [
      { name: 'IceGoblin',  arName: 'الغوبلن الجليدي', emoji: '🧊', hp: 600,  atk: 90,  def: 25, exp: 60,  gold: 30,  isBoss: false },
      { name: 'SnowGiant',  arName: 'العملاق الثلجي',  emoji: '❄️', hp: 900,  atk: 130, def: 40, exp: 100, gold: 50,  isBoss: false },
      { name: 'IceQueen',   arName: 'ملكة الجليد',     emoji: '👸', hp: 2500, atk: 200, def: 60, exp: 300, gold: 150, isBoss: true  },
    ],
  },
  {
    id: 3,
    name: 'برج اللهب',
    emoji: '🔥',
    levelReq: 16,
    levelMax: 25,
    bgFrom: '#1f0a00',
    bgTo: '#000',
    borderColor: '#ea580c',
    glowColor: 'rgba(234,88,12,0.6)',
    bossTitle: 'أمير الطابق الثالث',
    monsters: [
      { name: 'FireDemon',   arName: 'الشيطان الناري', emoji: '🔥', hp: 1000, atk: 160, def: 50, exp: 100, gold: 50,  isBoss: false },
      { name: 'HellPhoenix', arName: 'عنقاء الجحيم',   emoji: '🦅', hp: 1400, atk: 190, def: 45, exp: 150, gold: 75,  isBoss: false },
      { name: 'FlameDragon', arName: 'تنين اللهب',     emoji: '🐉', hp: 4000, atk: 280, def: 80, exp: 500, gold: 250, isBoss: true  },
    ],
  },
  {
    id: 4,
    name: 'قصر الظلام',
    emoji: '🌌',
    levelReq: 26,
    levelMax: 40,
    bgFrom: '#12002d',
    bgTo: '#000',
    borderColor: '#7c3aed',
    glowColor: 'rgba(124,58,237,0.6)',
    bossTitle: 'أمير الطابق الرابع',
    monsters: [
      { name: 'DarkKnightM',  arName: 'فارس الظلام',    emoji: '⚔️', hp: 1800, atk: 220, def: 90,  exp: 180, gold: 90,  isBoss: false },
      { name: 'RogueMage',    arName: 'الساحرة المارقة', emoji: '🧙', hp: 1500, atk: 260, def: 60,  exp: 200, gold: 100, isBoss: false },
      { name: 'DarkPrince',   arName: 'أمير الظلام',    emoji: '👑', hp: 6000, atk: 350, def: 120, exp: 800, gold: 400, isBoss: true  },
    ],
  },
  {
    id: 5,
    name: 'عرش الآلهة',
    emoji: '⚡',
    levelReq: 41,
    levelMax: 50,
    bgFrom: '#1f1700',
    bgTo: '#000',
    borderColor: '#d97706',
    glowColor: 'rgba(217,119,6,0.7)',
    bossTitle: 'إله الطابق الخامس',
    monsters: [
      { name: 'GodGuardian', arName: 'حارس الآلهة',  emoji: '⚡', hp: 3000,  atk: 300, def: 150, exp: 300,  gold: 150,  isBoss: false },
      { name: 'FallenAngel', arName: 'الملاك الساقط', emoji: '👼', hp: 2800,  atk: 320, def: 130, exp: 350,  gold: 175,  isBoss: false },
      { name: 'DeathGod',    arName: 'إله الفناء',   emoji: '💀', hp: 10000, atk: 500, def: 200, exp: 2000, gold: 1000, isBoss: true  },
    ],
  },
];

/** Returns which floor a player of the given level should be on (highest accessible floor) */
export function getPlayerFloor(level: number): FloorDef {
  const available = TOWER_FLOORS.filter(f => level >= f.levelReq);
  return available[available.length - 1] ?? TOWER_FLOORS[0];
}

/** Returns floor by id */
export function getFloorById(id: number): FloorDef {
  return TOWER_FLOORS.find(f => f.id === id) ?? TOWER_FLOORS[0];
}

/** Hero base stats lookup (for battle calculations) */
export const HERO_BASE_STATS: Record<string, { hp: number; atk: number; def: number; skill: string }> = {
  warrior:        { hp: 1000, atk: 150, def: 80,  skill: 'ضربة السيف'    },
  mage:           { hp: 700,  atk: 220, def: 40,  skill: 'كرة النار'      },
  assassin:       { hp: 800,  atk: 200, def: 50,  skill: 'ضربة الظل'     },
  executioner:    { hp: 1200, atk: 180, def: 100, skill: 'ضربة الإعدام'  },
  shaman:         { hp: 900,  atk: 160, def: 70,  skill: 'روح الطبيعة'   },
  dark_knight:    { hp: 1500, atk: 250, def: 120, skill: 'اندفاع الظلام' },
  thunder_goddess:{ hp: 1100, atk: 350, def: 80,  skill: 'صاعقة الآلهة'  },
};

/* ── Summon Pool ───────────────────────────────────────────── */

export const SUMMON_POOL: Record<HeroRarity, string[]> = {
  common:    ['warrior', 'mage', 'assassin'],
  rare:      ['executioner', 'shaman'],
  epic:      ['dark_knight'],
  legendary: ['thunder_goddess'],
};

export const SUMMON_COSTS = {
  normal:  100,
  premium: 500,
  x10:     900,
};
