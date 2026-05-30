// ============================================
// واجهة تطوير الأبطال - HeroUpgrade.tsx
// المسار: artifacts/rpg-game/src/components/HeroUpgrade.tsx
// ============================================

import { useState, useEffect } from "react";
import type { Hero, PlayerResources, HeroSkill } from "../../../../lib/types/hero";

// ---- ألوان النجوم ----
const RARITY_COLORS: Record<number, string> = {
  1: "#9ca3af",
  2: "#22c55e",
  3: "#3b82f6",
  4: "#a855f7",
  5: "#f59e0b",
};

const RARITY_BG: Record<number, string> = {
  1: "from-gray-800 to-gray-900",
  2: "from-green-900 to-gray-900",
  3: "from-blue-900 to-gray-900",
  4: "from-purple-900 to-gray-900",
  5: "from-yellow-900 to-gray-900",
};

const CLASS_ICONS: Record<string, string> = {
  warrior: "⚔️", mage: "🔮", archer: "🏹", healer: "💚", assassin: "🗡️",
};

// ---- مكون شريط التقدم ----
function ProgressBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ---- مكون النجوم ----
function StarDisplay({ stars, rarity }: { stars: number; rarity: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          style={{ color: i < stars ? RARITY_COLORS[rarity] : "#374151", fontSize: 14 }}
        >★</span>
      ))}
    </div>
  );
}

// ---- مكون إحصائية ----
function StatRow({ label, value, gain }: { label: string; value: number; gain?: number }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-700/50">
      <span className="text-gray-400 text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-bold">{Math.floor(value).toLocaleString()}</span>
        {gain && gain > 0 && (
          <span className="text-green-400 text-xs">+{Math.floor(gain)}</span>
        )}
      </div>
    </div>
  );
}

// ---- مكون المهارة ----
function SkillCard({
  skill, onUpgrade, canAfford,
}: { skill: HeroSkill; onUpgrade: (id: string) => void; canAfford: boolean }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 flex items-center justify-between gap-2">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white text-sm font-bold">{skill.name}</span>
          <span className="text-yellow-400 text-xs">Lv.{skill.level}/{skill.maxLevel}</span>
        </div>
        <p className="text-gray-400 text-xs mb-2">{skill.description}</p>
        <ProgressBar current={skill.level} max={skill.maxLevel} color="#a855f7" />
      </div>
      <button
        onClick={() => onUpgrade(skill.id)}
        disabled={!canAfford || skill.level >= skill.maxLevel}
        className="px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: canAfford && skill.level < skill.maxLevel
            ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
            : "#374151",
          color: "white",
        }}
      >
        {skill.level >= skill.maxLevel ? "MAX" : `📚 ${skill.upgradeCost * skill.level}`}
      </button>
    </div>
  );
}

// ============================================
// المكون الرئيسي
// ============================================
export default function HeroUpgrade({ heroId }: { heroId: string }) {
  const [hero, setHero] = useState<Hero | null>(null);
  const [resources, setResources] = useState<PlayerResources | null>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "skills" | "ascend">("stats");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statGains, setStatGains] = useState<Partial<Record<string, number>>>({});

  const API = "/api/heroes";

  async function fetchHero() {
    const [h, r] = await Promise.all([
      fetch(`${API}/${heroId}`).then(res => res.json()),
      fetch(`${API}/${heroId}/resources`).then(res => res.json()),
    ]);
    setHero(h.hero);
    setResources(r.resources);
  }

  useEffect(() => { fetchHero(); }, [heroId]);

  async function callApi(endpoint: string, body?: object) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/${heroId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setMessage(data.message);
      if (data.success) {
        setHero(data.hero);
        if (data.statGains) setStatGains(data.statGains);
        await fetchHero();
      }
    } catch {
      setMessage("❌ حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  if (!hero || !resources) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const starColor = RARITY_COLORS[hero.rarity];
  const expPct = (hero.exp / hero.expToNextLevel) * 100;

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${RARITY_BG[hero.rarity]} p-4`}
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* ---- رأس البطل ---- */}
      <div
        className="rounded-2xl p-4 mb-4 border"
        style={{
          background: `linear-gradient(135deg, ${starColor}22, #1f2937)`,
          borderColor: `${starColor}44`,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
            style={{ background: `${starColor}33`, border: `2px solid ${starColor}` }}
          >
            {CLASS_ICONS[hero.class]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-white text-lg font-bold">{hero.name}</h1>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: `${starColor}33`, color: starColor }}
              >
                {hero.class}
              </span>
            </div>
            <StarDisplay stars={hero.stars} rarity={hero.rarity} />
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-xs">المستوى</div>
            <div className="text-white text-2xl font-bold" style={{ color: starColor }}>
              {hero.level}
            </div>
            <div className="text-gray-500 text-xs">/{hero.maxLevel}</div>
          </div>
        </div>

        {/* شريط الـ EXP */}
        <div className="mb-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>EXP</span>
            <span>{hero.exp.toLocaleString()} / {hero.expToNextLevel.toLocaleString()}</span>
          </div>
          <ProgressBar current={hero.exp} max={hero.expToNextLevel} color="#f59e0b" />
        </div>

        {/* الموارد */}
        <div className="flex gap-3 mt-3 text-xs">
          <span className="text-yellow-400">🪙 {resources.gold.toLocaleString()}</span>
          <span className="text-blue-400">💎 {resources.gems.toLocaleString()}</span>
          <span className="text-purple-400">📚 {resources.skillBooks}</span>
          <span className="text-green-400">🔷 {resources.ascensionStones}</span>
        </div>
      </div>

      {/* ---- رسالة ---- */}
      {message && (
        <div
          className="mb-4 p-3 rounded-xl text-sm text-center font-medium"
          style={{
            background: message.includes("❌") ? "#7f1d1d44" : "#14532d44",
            border: `1px solid ${message.includes("❌") ? "#dc2626" : "#16a34a"}`,
            color: message.includes("❌") ? "#fca5a5" : "#86efac",
          }}
        >
          {message}
        </div>
      )}

      {/* ---- تبويبات ---- */}
      <div className="flex gap-2 mb-4">
        {(["stats", "skills", "ascend"] as const).map((tab) => {
          const labels = { stats: "⚡ الإحصائيات", skills: "🌀 المهارات", ascend: "🔥 الصعود" };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all"
              style={{
                background: activeTab === tab ? `${starColor}33` : "#1f2937",
                border: `1px solid ${activeTab === tab ? starColor : "#374151"}`,
                color: activeTab === tab ? starColor : "#9ca3af",
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ---- محتوى التبويبات ---- */}

      {activeTab === "stats" && (
        <div className="space-y-3">
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
            <h2 className="text-white font-bold mb-3 text-sm">📊 الإحصائيات الحالية</h2>
            <StatRow label="نقاط الحياة ❤️" value={hero.currentStats.hp} gain={statGains.hp} />
            <StatRow label="الهجوم ⚔️" value={hero.currentStats.attack} gain={statGains.attack} />
            <StatRow label="الدفاع 🛡️" value={hero.currentStats.defense} gain={statGains.defense} />
            <StatRow label="السرعة 💨" value={hero.currentStats.speed} gain={statGains.speed} />
            <StatRow label="نسبة الحاسمة 🎯" value={hero.currentStats.critRate} />
            <StatRow label="مضاعف الحاسمة 💥" value={hero.currentStats.critDamage} />
          </div>

          {/* ترقية EXP */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
            <h2 className="text-white font-bold mb-3 text-sm">⬆️ رفع المستوى</h2>
            <div className="grid grid-cols-3 gap-2">
              {[100, 500, 2000].map((exp) => (
                <button
                  key={exp}
                  onClick={() => callApi("add-exp", { expAmount: exp })}
                  disabled={loading || hero.level >= hero.maxLevel}
                  className="py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, #d97706, #92400e)",
                    color: "white",
                  }}
                >
                  +{exp.toLocaleString()} EXP
                </button>
              ))}
            </div>
          </div>

          {/* ترقية النجوم */}
          {hero.stars < 5 && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
              <h2 className="text-white font-bold mb-1 text-sm">⭐ ترقية النجوم</h2>
              <p className="text-gray-400 text-xs mb-3">
                {hero.stars}★ → {hero.stars + 1}★
              </p>
              <button
                onClick={() => callApi("upgrade-star")}
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{
                  background: `linear-gradient(135deg, ${starColor}, ${starColor}88)`,
                  color: "white",
                }}
              >
                ترقية إلى {hero.stars + 1}★
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "skills" && (
        <div className="space-y-3">
          {hero.skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onUpgrade={(id) => callApi("upgrade-skill", { skillId: id })}
              canAfford={resources.skillBooks >= skill.upgradeCost * skill.level}
            />
          ))}
          {hero.skills.length === 0 && (
            <div className="text-center text-gray-500 py-8">لا توجد مهارات متاحة</div>
          )}
        </div>
      )}

      {activeTab === "ascend" && (
        <div className="space-y-3">
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
            <h2 className="text-white font-bold mb-2 text-sm">🔥 الصعود</h2>
            <p className="text-gray-400 text-xs mb-4">
              الصعود يرفع إحصائياتك بشكل دائم. يجب أن تكون في المستوى الأقصى أولاً.
            </p>
            <div className="flex justify-between items-center mb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: i < hero.ascensionLevel ? "#ef444433" : "#1f2937",
                      border: `2px solid ${i < hero.ascensionLevel ? "#ef4444" : "#374151"}`,
                      color: i < hero.ascensionLevel ? "#ef4444" : "#6b7280",
                    }}
                  >
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => callApi("ascend")}
              disabled={loading || hero.ascensionLevel >= 6 || hero.level < hero.maxLevel}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #dc2626, #7f1d1d)",
                color: "white",
              }}
            >
              {hero.ascensionLevel >= 6 ? "✅ وصل الحد الأقصى" : `🔥 الصعود (المستوى ${hero.ascensionLevel + 1})`}
            </button>
            {hero.level < hero.maxLevel && (
              <p className="text-yellow-400 text-xs text-center mt-2">
                ⚠️ يجب الوصول للمستوى {hero.maxLevel} أولاً
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
