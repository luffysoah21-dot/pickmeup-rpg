import React, { useMemo } from 'react';
import { useLocation } from 'wouter';
import { PageTransition, Particles } from '@/components/PageLayout';
import { useGetPlayer, getGetPlayerQueryKey } from '@workspace/api-client-react';
import { getTelegramUser } from '@/lib/telegram';
import { HeroArt } from '@/components/HeroArt';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [, setLocation] = useLocation();
  const tgUser = useMemo(() => getTelegramUser(), []);

  const { data: player, isLoading } = useGetPlayer(
    { telegram_id: tgUser.telegram_id, username: tgUser.username },
    { query: { enabled: !!tgUser.telegram_id, queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id, username: tgUser.username }) } }
  );

  if (isLoading) {
    return (
      <PageTransition className="justify-center items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin" />
        <div className="mt-4 text-accent font-bold tracking-widest uppercase">جاري الاستدعاء...</div>
      </PageTransition>
    );
  }

  const needsHero = !player?.hero_type;

  return (
    <PageTransition className="justify-between py-10 px-6">
      <Particles />

      <div className="z-10 flex flex-col items-center">
        <div className="w-full flex justify-between items-start mb-8">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">اللاعب</span>
            <span className="text-xl font-black text-white">{player?.username || tgUser.username}</span>
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-accent rounded-full shadow-[0_0_5px_hsl(var(--accent))]" />
              <span className="text-accent font-bold">{player?.gold || 0}</span>
            </div>
            <span className="text-primary font-bold">مستوى {player?.level || 1}</span>
          </div>
        </div>

        <div className="relative w-48 h-48 flex items-center justify-center mb-8 border border-primary/30 rounded-full shadow-[inset_0_0_20px_rgba(139,0,0,0.2)] bg-card/50 backdrop-blur-sm">
          <div className="absolute inset-0 rounded-full border border-accent/20 animate-[spin_10s_linear_infinite]" />
          <HeroArt type={player?.hero_type} className="scale-150" />
        </div>

        {needsHero ? (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-accent mb-2 uppercase tracking-widest">لم يتم اختيار بطل</h2>
            <p className="text-sm text-muted-foreground">يجب عليك استدعاء بطل لبدء رحلتك.</p>
          </div>
        ) : (
          <div className="w-full mb-8">
            <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1">
              <span>الخبرة</span>
              <span>{player?.exp} / {player?.exp_to_next}</span>
            </div>
            <div className="h-2 w-full bg-card rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, ((player?.exp || 0) / (player?.exp_to_next || 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="z-10 w-full grid grid-cols-2 gap-4">
        {needsHero ? (
          <Button
            onClick={() => setLocation('/heroes')}
            className="col-span-2 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest border border-red-500 shadow-[0_0_15px_rgba(139,0,0,0.5)]"
          >
            استدعاء بطل
          </Button>
        ) : (
          <Button
            onClick={() => setLocation('/battle')}
            className="col-span-2 h-16 bg-primary hover:bg-primary/90 text-white text-lg font-black uppercase tracking-widest border border-red-500 shadow-[0_0_15px_rgba(139,0,0,0.5)]"
          >
            ابدأ القتال
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => setLocation('/heroes')}
          className="h-12 bg-card/50 border-secondary text-white font-bold hover:bg-secondary/50 hover:text-white"
        >
          الأبطال
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation('/shop')}
          className="h-12 bg-card/50 border-secondary text-white font-bold hover:bg-secondary/50 hover:text-white"
        >
          المتجر
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation('/leaderboard')}
          className="col-span-2 h-12 bg-card/50 border-secondary text-white font-bold hover:bg-secondary/50 hover:text-white"
        >
          المتصدرون
        </Button>
      </div>
    </PageTransition>
  );
}
