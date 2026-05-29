import React from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '@/components/PageLayout';
import { useGetLeaderboard, getGetLeaderboardQueryKey } from '@workspace/api-client-react';
import { HeroArt } from '@/components/HeroArt';
import { Button } from '@/components/ui/button';

const HERO_NAMES: Record<string, string> = {
  warrior: 'محارب',
  mage: 'ساحر',
  assassin: 'محتال',
};

export default function Leaderboard() {
  const [, setLocation] = useLocation();

  const { data: leaderboard, isLoading } = useGetLeaderboard(
    { limit: 50 },
    { query: { queryKey: getGetLeaderboardQueryKey({ limit: 50 }) } }
  );

  return (
    <PageTransition className="p-6">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" className="p-0 text-muted-foreground hover:bg-transparent hover:text-white" onClick={() => setLocation('/')}>
          <span className="ms-2">→</span> رجوع
        </Button>
        <h1 className="text-xl font-black tracking-widest text-accent uppercase">المتصدرون</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard?.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center gap-4 bg-card border border-border p-3 rounded-lg relative overflow-hidden"
              >
                {entry.rank <= 3 && (
                  <div className="absolute inset-0 bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
                )}

                <div className={`w-8 text-center font-black text-xl ${
                  entry.rank === 1 ? 'text-accent' :
                  entry.rank === 2 ? 'text-slate-300' :
                  entry.rank === 3 ? 'text-amber-600' :
                  'text-muted-foreground'
                }`}>
                  #{entry.rank}
                </div>

                <div className="w-12 h-12 shrink-0 bg-background rounded-full border border-border flex items-center justify-center overflow-hidden">
                  <HeroArt type={entry.hero_type} className="scale-75" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{entry.username}</div>
                  <div className="text-xs text-primary font-bold">
                    مستوى {entry.level}
                    {entry.hero_type && <span className="text-muted-foreground"> · {HERO_NAMES[entry.hero_type] ?? entry.hero_type}</span>}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">ذهب</div>
                  <div className="text-sm font-mono text-accent">{entry.gold}</div>
                </div>
              </div>
            ))}

            {(!leaderboard || leaderboard.length === 0) && (
              <div className="text-center py-20 text-muted-foreground">
                لم يُسجَّل أي أبطال أسطوريون بعد.
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
