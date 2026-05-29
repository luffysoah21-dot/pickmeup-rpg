import React, { useMemo } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '@/components/PageLayout';
import { useGetPlayer, getGetPlayerQueryKey, useSelectHero, useUpgradeSkill } from '@workspace/api-client-react';
import { getTelegramUser } from '@/lib/telegram';
import { HeroArt } from '@/components/HeroArt';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const HEROES = [
  {
    type: 'warrior',
    name: 'المحارب',
    hp: 1000,
    atk: 150,
    def: 80,
    skill: 'ضربة السيف',
    desc: 'فارس مدرّع بدرجة عالية. متانة قصوى وقدرة دفاعية فائقة.',
  },
  {
    type: 'mage',
    name: 'الساحر',
    hp: 700,
    atk: 220,
    def: 40,
    skill: 'كرة النار',
    desc: 'ساحر غامض يُطلق قوى أركانية مدمّرة.',
  },
  {
    type: 'assassin',
    name: 'المُحتال',
    hp: 800,
    atk: 200,
    def: 50,
    skill: 'ضربة الظل',
    desc: 'لص الظلام. يضرب بسرعة خاطفة ويختفي قبل أن يُرى.',
  },
];

export default function Heroes() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tgUser = useMemo(() => getTelegramUser(), []);

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

  if (isLoading) {
    return (
      <PageTransition className="justify-center items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin" />
      </PageTransition>
    );
  }

  const handleSelect = (heroType: string) => {
    selectHeroMut.mutate({
      data: { hero_type: heroType as 'warrior' | 'mage' | 'assassin' },
      params: { telegram_id: tgUser.telegram_id },
    });
  };

  const handleUpgrade = () => {
    if (player?.gold && player.gold >= 100) {
      upgradeSkillMut.mutate({ params: { telegram_id: tgUser.telegram_id } });
    } else {
      toast({ title: 'ذهب غير كافٍ', description: 'تحتاج إلى 100 ذهب لترقية مهارتك.', variant: 'destructive' });
    }
  };

  return (
    <PageTransition className="p-6">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" className="p-0 text-muted-foreground hover:bg-transparent hover:text-white" onClick={() => setLocation('/')}>
          <span className="ms-2">→</span> رجوع
        </Button>
        <h1 className="text-xl font-black tracking-widest text-accent uppercase">استدعاء الأبطال</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-6">
        {HEROES.map((h) => {
          const isSelected = player?.hero_type === h.type;

          return (
            <div
              key={h.type}
              className={`p-4 rounded-xl border ${isSelected ? 'border-accent bg-card shadow-[0_0_15px_rgba(240,192,64,0.1)]' : 'border-border bg-card/50'}`}
            >
              <div className="flex gap-4">
                <div className="shrink-0 flex items-center justify-center w-20 h-20 bg-background rounded-lg border border-border">
                  <HeroArt type={h.type} />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg text-white mb-1 uppercase tracking-wider flex items-center justify-between">
                    {h.name}
                    {isSelected && <span className="text-[10px] bg-accent text-black px-2 py-0.5 rounded-sm">مُختار</span>}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2 leading-tight">{h.desc}</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs font-mono">
                    <span className="text-green-400">صحة: {h.hp}</span>
                    <span className="text-red-400">هجوم: {h.atk}</span>
                    <span className="text-blue-400">دفاع: {h.def}</span>
                  </div>
                </div>
              </div>

              {isSelected ? (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-white">مهارة: <span className="text-accent">{h.skill}</span></span>
                    <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">مستوى {player?.hero_level || 1}</span>
                  </div>
                  <Button
                    className="w-full bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50"
                    onClick={handleUpgrade}
                    disabled={upgradeSkillMut.isPending}
                  >
                    ترقية المهارة (100 ذهب)
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full mt-4 bg-secondary hover:bg-secondary/80 text-white"
                  onClick={() => handleSelect(h.type)}
                  disabled={selectHeroMut.isPending}
                >
                  اختر {h.name}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </PageTransition>
  );
}
