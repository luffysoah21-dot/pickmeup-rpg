import React, { useMemo } from 'react';
import { useLocation } from 'wouter';
import { PageTransition, Particles } from '@/components/PageLayout';
import { useGetPlayer, getGetPlayerQueryKey } from '@workspace/api-client-react';
import { getTelegramUser } from '@/lib/telegram';
import { HeroArt } from '@/components/HeroArt';
import { Button } from '@/components/ui/button';
import { getPlayerFloor } from '@/lib/game-data';

const EXP_TO_NEXT = (level: number) => level * 100;

export default function Home() {
  const [, setLocation] = useLocation();
  const tgUser = useMemo(() => getTelegramUser(), []);

  const { data: player, isLoading } = useGetPlayer(
    { telegram_id: tgUser.telegram_id, username: tgUser.username },
    {
      query: {
        enabled: !!tgUser.telegram_id,
        queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id, username: tgUser.username }),
        staleTime: 0,
      },
    }
  );

  if (isLoading) {
    return (
      <PageTransition className="justify-center items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin" />
        <div className="mt-4 text-accent font-bold tracking-widest uppercase">جاري الاستدعاء...</div>
      </PageTransition>
    );
  }

  const level      = player?.level || 1;
  const exp        = player?.exp ?? 0;
  const expToNext  = player?.exp_to_next && player.exp_to_next > 0 ? player.exp_to_next : EXP_TO_NEXT(level);
  const expPercent = Math.min(100, (exp / expToNext) * 100);
  const needsHero  = !player?.hero_type;
  const floor      = getPlayerFloor(level);

  return (
    <PageTransition className="justify-between py-8 px-6">
      <Particles />

      <div className="z-10 flex flex-col items-center">
        {/* Header row */}
        <div className="w-full flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">اللاعب</span>
            <span className="text-xl font-black text-white">{player?.username || tgUser.username}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-accent rounded-full shadow-[0_0_5px_hsl(var(--accent))]" />
              <span className="text-accent font-bold font-mono">{player?.gold ?? 0}</span>
            </div>
            <span className="text-primary font-bold">مستوى {level}</span>
          </div>
        </div>

        {/* Hero portrait */}
        <div className="relative w-44 h-44 flex items-center justify-center mb-5 border border-primary/30 rounded-full shadow-[inset_0_0_20px_rgba(139,0,0,0.2)] bg-card/50 backdrop-blur-sm">
          <div className="absolute inset-0 rounded-full border border-accent/20"
            style={{ animation: 'idle-spin-cw 10s linear infinite' }} />
          <HeroArt type={player?.hero_type} className="scale-150" />
        </div>

        {/* Current floor indicator */}
        <div
          className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: `${floor.glowColor}`,
            border: `1px solid ${floor.borderColor}`,
            boxShadow: `0 0 8px ${floor.glowColor}`,
          }}
        >
          <span>{floor.emoji}</span>
          <span className="text-white">الطابق {floor.id}: {floor.name}</span>
        </div>

        {needsHero ? (
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-accent mb-2 uppercase tracking-widest">لم يتم اختيار بطل</h2>
            <p className="text-sm text-muted-foreground">قم باستدعاء بطل لبدء رحلتك!</p>
          </div>
        ) : (
          <div className="w-full mb-4">
            <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1">
              <span>الخبرة</span>
              <span className="font-mono tabular-nums">{exp} / {expToNext}</span>
            </div>
            <div className="h-2.5 w-full bg-card rounded-full overflow-hidden border border-border">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${expPercent}%`,
                  background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation grid */}
      <div className="z-10 w-full grid grid-cols-2 gap-3">
        {needsHero ? (
          <Button
            onClick={() => setLocation('/summon')}
            className="col-span-2 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest border border-red-500 shadow-[0_0_15px_rgba(139,0,0,0.5)]"
          >
            ✨ استدعاء بطل
          </Button>
        ) : (
          <Button
            onClick={() => setLocation('/tower')}
            className="col-span-2 h-14 bg-primary hover:bg-primary/90 text-white text-lg font-black uppercase tracking-widest border border-red-500 shadow-[0_0_15px_rgba(139,0,0,0.5)]"
          >
            ⚔️ برج الأبطال
          </Button>
        )}

        <Button variant="outline" onClick={() => setLocation('/heroes')}
          className="h-11 bg-card/50 border-secondary text-white font-bold hover:bg-secondary/50 hover:text-white">
          الأبطال
        </Button>
        <Button variant="outline" onClick={() => setLocation('/summon')}
          className="h-11 bg-card/50 border-secondary text-white font-bold hover:bg-secondary/50 hover:text-white">
          ✨ استدعاء
        </Button>
        <Button variant="outline" onClick={() => setLocation('/shop')}
          className="h-11 bg-card/50 border-secondary text-white font-bold hover:bg-secondary/50 hover:text-white">
          المتجر
        </Button>
        <Button variant="outline" onClick={() => setLocation('/leaderboard')}
          className="h-11 bg-card/50 border-secondary text-white font-bold hover:bg-secondary/50 hover:text-white">
          المتصدرون
        </Button>
      </div>
    </PageTransition>
  );
}
