import React, { useMemo } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '@/components/PageLayout';
import { useGetPlayer, getGetPlayerQueryKey, useSelectHero, useUpgradeSkill } from '@workspace/api-client-react';
import { getTelegramUser } from '@/lib/telegram';
import { HeroArt } from '@/components/HeroArt';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ALL_HEROES, RARITY_COLORS, STARTER_HEROES } from '@/lib/game-data';

export default function Heroes() {
  const [, setLocation] = useLocation();
  const { toast }       = useToast();
  const queryClient     = useQueryClient();
  const tgUser          = useMemo(() => getTelegramUser(), []);

  const { data: player, isLoading } = useGetPlayer(
    { telegram_id: tgUser.telegram_id },
    { query: { enabled: !!tgUser.telegram_id, queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) } }
  );

  const selectHeroMut = useSelectHero({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) });
        toast({ title: 'تم اختيار البطل!', description: 'رحلتك تبدأ الآن.', className: 'bg-primary border-none text-white' });
      },
    },
  });

  const upgradeSkillMut = useUpgradeSkill({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) });
        toast({ title: 'تمت ترقية المهارة!', description: 'بطلك أصبح أقوى.', className: 'bg-accent border-none text-black' });
      },
    },
  });

  const handleUpgrade = () => {
    if (player?.gold && player.gold >= 100) {
      upgradeSkillMut.mutate({ params: { telegram_id: tgUser.telegram_id } });
    } else {
      toast({ title: 'ذهب غير كافٍ', description: 'تحتاج إلى 100 ذهب لترقية مهارتك.', variant: 'destructive' });
    }
  };

  const handleStarUpgrade = () => {
    fetch(`/api/players/me/hero-stars?telegram_id=${tgUser.telegram_id}`, { method: 'PATCH' })
      .then(res => res.json())
      .then(data => {
        toast({ title: data.message ?? 'تمت الترقية!', className: 'bg-primary border-none text-white' });
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) });
      });
  };

  const handleAscend = () => {
    fetch(`/api/players/me/hero-ascend?telegram_id=${tgUser.telegram_id}`, { method: 'PATCH' })
      .then(res => res.json())
      .then(data => {
        toast({ title: data.message ?? 'تم الصعود!', className: 'bg-primary border-none text-white' });
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) });
      });
  };

  if (isLoading) {
    return (
      <PageTransition className="justify-center items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin" />
      </PageTransition>
    );
  }

  const ownedHeroes = player?.owned_heroes ?? [];
  const playerLevel = player?.level ?? 1;

  const isUnlocked = (heroType: string) =>
    STARTER_HEROES.includes(heroType) || ownedHeroes.includes(heroType);

  const handleSelect = (heroType: string) => {
    selectHeroMut.mutate({
      data: { hero_type: heroType },
      params: { telegram_id: tgUser.telegram_id },
    });
  };

  return (
    <PageTransition className="p-4">
      <div className="flex items-center justify-between mb-5">
        <Button variant="ghost" className="p-0 text-muted-foreground hover:bg-transparent hover:text-white"
          onClick={() => setLocation('/')}>
          <span className="ms-2">→</span> رجوع
        </Button>
        <h1 className="text-xl font-black tracking-widest text-accent uppercase">أبطالي</h1>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-accent"
          onClick={() => setLocation('/summon')}>
          ✨ استدعاء
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {ALL_HEROES.map(h => {
          const isSelected = player?.hero_type === h.type;
          const unlocked   = isUnlocked(h.type);
          const levelOk    = playerLevel >= h.unlockLevel;
          const rc         = RARITY_COLORS[h.rarity];

          return (
            <div
              key={h.type}
              className="rounded-xl border overflow-hidden transition-all"
              style={{
                borderColor: isSelected ? rc.border : unlocked ? `${rc.border}66` : '#374151',
                boxShadow: isSelected ? `0 0 14px ${rc.glow}` : undefined,
                background: unlocked ? 'hsl(260,59%,8%)' : '#0a0a0a',
                opacity: !unlocked && !levelOk ? 0.6 : 1,
              }}
            >
              <div className="p-3 flex gap-3">
                <div className="shrink-0 flex items-center justify-center w-20 h-20 rounded-lg overflow-hidden bg-black/40">
                  {unlocked ? (
                    <HeroArt type={h.type} selected={isSelected} />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="text-3xl grayscale opacity-40">{h.emoji}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {!levelOk ? `مستوى ${h.unlockLevel}` : '🔒 استدعاء'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-black text-white text-base">{h.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: rc.border, background: `${rc.border}22` }}>{rc.label}</span>
                      {isSelected && (
                        <span className="text-[9px] bg-accent text-black px-1.5 py-0.5 rounded font-black">نشط</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-1.5 leading-tight">{h.desc}</p>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono mb-1.5">
                    <span className="text-green-400">❤️ {h.hp}</span>
                    <span className="text-red-400">⚔️ {h.atk}</span>
                    <span className="text-blue-400">🛡️ {h.def}</span>
                  </div>
                  <div className="text-[10px] text-accent/80">✨ {h.skill}: <span className="text-white/60">{h.skillDesc}</span></div>
                </div>
              </div>

              {/* Action row */}
              {unlocked && (
                <div className="px-3 pb-3">
                  {isSelected ? (
                    <div className="pt-2 border-t border-border/30 space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-white font-bold">مهارة: <span className="text-accent">{h.skill}</span></span>
                        <span className="text-[10px] font-mono bg-secondary px-2 py-0.5 rounded">مستوى {player?.hero_level ?? 1}</span>
                      </div>
                      {/* ترقية المهارة */}
                      <Button className="w-full bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50 h-9 text-xs"
                        onClick={handleUpgrade} disabled={upgradeSkillMut.isPending}>
                        ⬆️ ترقية المهارة (100 ذهب)
                      </Button>
                      {/* ترقية النجوم */}
                      <Button className="w-full h-9 text-xs font-bold bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/50"
                        onClick={handleStarUpgrade}>
                        ⭐ ترقية النجوم
                      </Button>
                      {/* الصعود */}
                      <Button className="w-full h-9 text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                        onClick={handleAscend}>
                        🔥 صعود البطل
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full h-9 text-xs font-bold"
                      style={{ background: rc.border }}
                      onClick={() => handleSelect(h.type)}
                      disabled={selectHeroMut.isPending}>
                      اختر {h.name}
                    </Button>
                  )}
                </div>
              )}

              {!unlocked && (
                <div className="px-3 pb-3">
                  <Button className="w-full h-9 text-xs bg-secondary/50 hover:bg-secondary text-white"
                    onClick={() => setLocation('/summon')}>
                    {levelOk ? `🔒 استدعاء للحصول عليه` : `🔒 يُفتح في المستوى ${h.unlockLevel}`}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageTransition>
  );
}
