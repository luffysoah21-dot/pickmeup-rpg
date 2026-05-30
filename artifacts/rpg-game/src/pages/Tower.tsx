import React, { useMemo } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '@/components/PageLayout';
import { useGetPlayer, getGetPlayerQueryKey } from '@workspace/api-client-react';
import { getTelegramUser } from '@/lib/telegram';
import { TOWER_FLOORS, getPlayerFloor } from '@/lib/game-data';
import { Button } from '@/components/ui/button';

export default function Tower() {
  const [, setLocation] = useLocation();
  const tgUser = useMemo(() => getTelegramUser(), []);

  const { data: player, isLoading } = useGetPlayer(
    { telegram_id: tgUser.telegram_id },
    { query: { enabled: !!tgUser.telegram_id, queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) } }
  );

  const level       = player?.level ?? 1;
  const currentFloor = getPlayerFloor(level);

  if (isLoading) {
    return (
      <PageTransition className="justify-center items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin" />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Button variant="ghost" className="p-0 text-muted-foreground hover:bg-transparent hover:text-white"
          onClick={() => setLocation('/')}>
          <span className="ms-2">→</span> رجوع
        </Button>
        <h1 className="text-xl font-black tracking-widest text-accent uppercase">برج الأبطال</h1>
        <div className="text-xs text-muted-foreground font-mono">مستوى {level}</div>
      </div>

      {/* Floor cards — bottom to top visually (floor 5 at top, 1 at bottom) */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {[...TOWER_FLOORS].reverse().map(floor => {
          const locked    = level < floor.levelReq;
          const isCurrent = floor.id === currentFloor.id;

          return (
            <div
              key={floor.id}
              className="rounded-xl border overflow-hidden transition-all"
              style={{
                borderColor: locked ? '#374151' : floor.borderColor,
                boxShadow: isCurrent ? `0 0 16px 4px ${floor.glowColor}` : undefined,
                background: locked
                  ? 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)'
                  : `linear-gradient(135deg, ${floor.bgFrom} 0%, ${floor.bgTo} 100%)`,
                opacity: locked ? 0.55 : 1,
              }}
            >
              {/* Floor header */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl"
                    style={{ filter: locked ? 'grayscale(1)' : `drop-shadow(0 0 8px ${floor.glowColor})` }}>
                    {locked ? '🔒' : floor.emoji}
                  </span>
                  <div>
                    <div className="font-black text-white text-base">الطابق {floor.id} — {floor.name}</div>
                    <div className="text-xs text-muted-foreground">
                      مستوى {floor.levelReq}–{floor.levelMax}
                      {locked && <span className="ms-2 text-red-400">• مقفل</span>}
                      {isCurrent && <span className="ms-2 text-accent font-bold">• الطابق الحالي</span>}
                    </div>
                  </div>
                </div>
                {isCurrent && (
                  <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
                )}
              </div>

              {/* Monsters preview */}
              {!locked && (
                <div className="px-3 pb-2">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {floor.monsters.map(m => (
                      <div key={m.name} className="flex items-center gap-1 bg-black/40 rounded-lg px-2 py-1">
                        <span className="text-base">{m.emoji}</span>
                        <span className="text-xs text-white/80">{m.arName}</span>
                        {m.isBoss && <span className="text-[9px] bg-accent text-black font-black px-1 rounded ms-1">زعيم</span>}
                      </div>
                    ))}
                  </div>

                  {/* Rewards preview */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span>🏆 {floor.monsters.find(m => m.isBoss)?.exp ?? 0} خبرة</span>
                    <span>💰 {floor.monsters.find(m => m.isBoss)?.gold ?? 0} ذهب</span>
                  </div>

                  {/* Battle buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="h-9 text-xs font-bold"
                      style={{ background: floor.borderColor, border: `1px solid ${floor.borderColor}` }}
                      onClick={() => setLocation(`/battle?floor=${floor.id}`)}
                    >
                      ⚔️ قتال عادي
                    </Button>
                    <Button
                      className="h-9 text-xs font-bold bg-black/60 hover:bg-black/80 border text-accent"
                      style={{ borderColor: floor.borderColor }}
                      onClick={() => setLocation(`/battle?floor=${floor.id}&boss=1`)}
                    >
                      🎵 تحدّ الزعيم
                    </Button>
                  </div>
                </div>
              )}

              {locked && (
                <div className="px-3 pb-3 text-center text-xs text-muted-foreground">
                  يُفتح عند الوصول إلى المستوى {floor.levelReq}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageTransition>
  );
}
