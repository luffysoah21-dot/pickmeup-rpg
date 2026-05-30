import React, { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '@/components/PageLayout';
import { useGetPlayer, getGetPlayerQueryKey, usePerformSummon } from '@workspace/api-client-react';
import { getTelegramUser } from '@/lib/telegram';
import { HeroArt } from '@/components/HeroArt';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { ALL_HEROES, RARITY_COLORS, SUMMON_COSTS } from '@/lib/game-data';
import type { HeroRarity } from '@/lib/game-data';

type SummonType = 'normal' | 'premium' | 'x10';

interface SummonedHero { hero_type: string; rarity: HeroRarity; is_new: boolean }

type Phase = 'idle' | 'spinning' | 'reveal';

export default function Summon() {
  const [, setLocation] = useLocation();
  const queryClient     = useQueryClient();
  const tgUser          = useMemo(() => getTelegramUser(), []);

  const { data: player, isLoading } = useGetPlayer(
    { telegram_id: tgUser.telegram_id },
    { query: { enabled: !!tgUser.telegram_id, queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) } }
  );

  const summonMut = usePerformSummon({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) });
      },
    },
  });

  const [phase,   setPhase]   = useState<Phase>('idle');
  const [results, setResults] = useState<SummonedHero[]>([]);
  const [revealed, setRevealed] = useState(0);

  const handleSummon = (type: SummonType) => {
    const cost = SUMMON_COSTS[type];
    if ((player?.gold ?? 0) < cost) return;

    setPhase('spinning');
    summonMut.mutate(
      { data: { telegram_id: tgUser.telegram_id, summon_type: type } },
      {
        onSuccess: data => {
          const summoned = (data as any).summoned as SummonedHero[];
          setResults(summoned);
          setTimeout(() => {
            setPhase('reveal');
            setRevealed(0);
            // Reveal cards one by one
            summoned.forEach((_, i) => {
              setTimeout(() => setRevealed(prev => prev + 1), i * 300);
            });
          }, 1400);
        },
        onError: () => setPhase('idle'),
      }
    );
  };

  const reset = () => { setPhase('idle'); setResults([]); setRevealed(0); };

  const gold = player?.gold ?? 0;
  const pityEpic      = player?.pity_epic ?? 0;
  const pityLegendary = player?.pity_legendary ?? 0;

  if (isLoading) {
    return (
      <PageTransition className="justify-center items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin" />
      </PageTransition>
    );
  }

  /* ── Spinning animation ── */
  if (phase === 'spinning') {
    return (
      <PageTransition className="justify-center items-center bg-black">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-40 h-40 rounded-full border-4 border-accent/30 animate-spin" />
          <div className="absolute w-32 h-32 rounded-full border-4 border-purple-500/40"
            style={{ animation: 'spin 1.5s linear infinite reverse' }} />
          <div className="text-6xl animate-pulse">✨</div>
        </div>
        <div className="mt-6 text-accent font-black text-xl tracking-widest animate-pulse">
          جاري الاستدعاء...
        </div>
      </PageTransition>
    );
  }

  /* ── Reveal results ── */
  if (phase === 'reveal' && results.length > 0) {
    // Check for legendary in results
    const hasLegendary = results.some(r => r.rarity === 'legendary');

    return (
      <PageTransition className="bg-black relative overflow-hidden">
        {/* Legendary explosion BG */}
        {hasLegendary && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.15) 0%, transparent 70%)', animation: 'pulse 2s ease-in-out infinite' }} />
        )}

        <div className="p-4 pt-6 flex-1 overflow-y-auto">
          <h2 className="text-2xl font-black text-accent text-center mb-4 tracking-widest">
            {hasLegendary ? '🌟 أسطوري!' : '✨ نتائج الاستدعاء'}
          </h2>

          <div className={`grid gap-3 ${results.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-2'}`}>
            {results.map((r, i) => {
              const heroDef  = ALL_HEROES.find(h => h.type === r.hero_type);
              const rc       = RARITY_COLORS[r.rarity];
              const visible  = i < revealed;
              return (
                <div
                  key={i}
                  className="rounded-xl p-3 flex flex-col items-center text-center transition-all duration-300"
                  style={{
                    border: `2px solid ${rc.border}`,
                    boxShadow: `0 0 16px 4px ${rc.glow}`,
                    background: 'linear-gradient(145deg, #0a0a0a, #1a1a2e)',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(10px)',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <HeroArt type={r.hero_type} selected={r.rarity === 'legendary' || r.rarity === 'epic'} />
                  <div className="mt-2 font-black text-white text-sm">{heroDef?.name ?? r.hero_type}</div>
                  <div className="text-xs mt-0.5" style={{ color: rc.border }}>{rc.stars} {rc.label}</div>
                  {r.is_new && (
                    <div className="mt-1 bg-green-600/30 border border-green-500 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      جديد! 🎉
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          <Button className="h-12 bg-primary hover:bg-primary/80 text-white font-bold border border-red-500"
            onClick={reset}>
            استدعاء مجدداً
          </Button>
          <Button variant="outline" className="h-12 border-white/20 text-white/80 hover:bg-white/10"
            onClick={() => setLocation('/')}>
            🏠 القائمة
          </Button>
        </div>
      </PageTransition>
    );
  }

  /* ── Idle — summon type selection ── */
  return (
    <PageTransition className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Button variant="ghost" className="p-0 text-muted-foreground hover:bg-transparent hover:text-white"
          onClick={() => setLocation('/')}>
          <span className="ms-2">→</span> رجوع
        </Button>
        <h1 className="text-xl font-black tracking-widest text-accent">✨ الاستدعاء</h1>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-accent rounded-full" />
          <span className="text-accent font-bold font-mono">{gold}</span>
        </div>
      </div>

      {/* Pity indicators */}
      <div className="bg-card/60 border border-border rounded-xl p-3 mb-4">
        <div className="text-xs text-muted-foreground text-center mb-2 font-bold uppercase tracking-wider">عداد الضمان</div>
        <div className="grid grid-cols-2 gap-3 text-center text-xs">
          <div>
            <div className="text-purple-400 font-black text-base">{10 - pityEpic}</div>
            <div className="text-muted-foreground">استدعاء حتى الملحمي ⭐⭐⭐</div>
          </div>
          <div>
            <div className="text-yellow-400 font-black text-base">{50 - pityLegendary}</div>
            <div className="text-muted-foreground">استدعاء حتى الأسطوري ⭐⭐⭐⭐</div>
          </div>
        </div>
      </div>

      {/* Summon type cards */}
      <div className="flex-1 space-y-3">
        {/* Normal */}
        <SummonCard
          title="استدعاء عادي"
          subtitle="بطل عشوائي"
          cost={SUMMON_COSTS.normal}
          gold={gold}
          probabilities={[
            { label: '⭐ شائع',  chance: '60%', color: '#9ca3af' },
            { label: '⭐⭐ نادر', chance: '25%', color: '#3b82f6' },
            { label: '⭐⭐⭐ ملحمي',  chance: '12%', color: '#a855f7' },
            { label: '⭐⭐⭐⭐ أسطوري', chance: '3%',  color: '#f59e0b' },
          ]}
          glowColor="rgba(156,163,175,0.3)"
          borderColor="#6b7280"
          onSummon={() => handleSummon('normal')}
        />

        {/* Premium */}
        <SummonCard
          title="استدعاء مميز"
          subtitle="ضمان نادر أو أعلى"
          cost={SUMMON_COSTS.premium}
          gold={gold}
          badge="ضمان نادر"
          probabilities={[
            { label: '⭐⭐ نادر',      chance: '85%', color: '#3b82f6' },
            { label: '⭐⭐⭐ ملحمي',   chance: '12%', color: '#a855f7' },
            { label: '⭐⭐⭐⭐ أسطوري', chance: '3%',  color: '#f59e0b' },
          ]}
          glowColor="rgba(59,130,246,0.3)"
          borderColor="#3b82f6"
          onSummon={() => handleSummon('premium')}
        />

        {/* x10 */}
        <SummonCard
          title="استدعاء ×10"
          subtitle="خصم 10% — ضمان ملحمي"
          cost={SUMMON_COSTS.x10}
          gold={gold}
          badge="ضمان ملحمي"
          probabilities={[
            { label: '⭐ شائع',       chance: '60%', color: '#9ca3af' },
            { label: '⭐⭐ نادر',      chance: '25%', color: '#3b82f6' },
            { label: '⭐⭐⭐ ملحمي',   chance: '12%', color: '#a855f7' },
            { label: '⭐⭐⭐⭐ أسطوري', chance: '3%',  color: '#f59e0b' },
          ]}
          glowColor="rgba(168,85,247,0.3)"
          borderColor="#a855f7"
          onSummon={() => handleSummon('x10')}
        />
      </div>

      {/* Pool preview */}
      <div className="mt-4 bg-card/40 border border-border rounded-xl p-3">
        <div className="text-xs text-muted-foreground font-bold mb-2 text-center">بركة الاستدعاء</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {ALL_HEROES.map(h => (
            <div key={h.type} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${RARITY_COLORS[h.rarity].glow}`, border: `1px solid ${RARITY_COLORS[h.rarity].border}` }}>
              <span>{h.emoji}</span>
              <span className="text-white/80">{h.name}</span>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}

/* ── Summon card sub-component ─────────────────────────────────────────────── */
interface SummonCardProps {
  title: string;
  subtitle: string;
  cost: number;
  gold: number;
  badge?: string;
  probabilities: { label: string; chance: string; color: string }[];
  glowColor: string;
  borderColor: string;
  onSummon: () => void;
}

function SummonCard({ title, subtitle, cost, gold, badge, probabilities, glowColor, borderColor, onSummon }: SummonCardProps) {
  const canAfford = gold >= cost;
  return (
    <div className="rounded-xl border p-3"
      style={{ borderColor, boxShadow: `0 0 12px ${glowColor}`, background: 'linear-gradient(135deg, #0a0a0a, #111)' }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-black text-white text-base">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-accent rounded-full" />
            <span className="font-black text-accent font-mono">{cost}</span>
          </div>
          {badge && (
            <span className="text-[9px] bg-current/20 border px-1.5 py-0.5 rounded-full font-bold"
              style={{ borderColor, color: borderColor }}>{badge}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mb-3">
        {probabilities.map(p => (
          <span key={p.label} className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ color: p.color, background: `${p.color}22` }}>
            {p.label}: {p.chance}
          </span>
        ))}
      </div>
      <Button
        className="w-full h-10 font-black"
        style={{ background: canAfford ? borderColor : '#374151', opacity: canAfford ? 1 : 0.5 }}
        onClick={onSummon}
        disabled={!canAfford}
      >
        {canAfford ? '✨ استدعاء' : '💰 ذهب غير كافٍ'}
      </Button>
    </div>
  );
}
