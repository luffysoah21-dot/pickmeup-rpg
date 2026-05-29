import React, { useMemo } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '@/components/PageLayout';
import { useGetPlayer, getGetPlayerQueryKey } from '@workspace/api-client-react';
import { getTelegramUser } from '@/lib/telegram';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ITEMS = [
  { id: 'potion_s', name: 'جرعة الصحة الصغيرة', desc: 'يُعيد 20% من نقاط الصحة أثناء المعركة.', price: 50, type: 'consumable' },
  { id: 'potion_l', name: 'جرعة الصحة الكبيرة', desc: 'يُعيد 50% من نقاط الصحة أثناء المعركة.', price: 120, type: 'consumable' },
  { id: 'whetstone', name: 'حجر الشحذ', desc: 'يزيد الهجوم بنسبة 10% للمعركة التالية.', price: 200, type: 'buff' },
  { id: 'charm', name: 'تميمة الحماية', desc: 'يزيد الدفاع بنسبة 20% للمعركة التالية.', price: 250, type: 'buff' },
];

export default function Shop() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const tgUser = useMemo(() => getTelegramUser(), []);

  const { data: player, isLoading } = useGetPlayer(
    { telegram_id: tgUser.telegram_id },
    { query: { enabled: !!tgUser.telegram_id, queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) } }
  );

  const handlePurchase = (item: typeof ITEMS[number]) => {
    if (!player?.gold || player.gold < item.price) {
      toast({ title: 'ذهب غير كافٍ', description: `تحتاج إلى ${item.price} ذهب.`, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم الشراء!', description: `${item.name} أُضيف إلى المخزون.`, className: 'bg-accent text-black border-none' });
  };

  return (
    <PageTransition className="p-6">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" className="p-0 text-muted-foreground hover:bg-transparent hover:text-white" onClick={() => setLocation('/')}>
          <span className="ms-2">→</span> رجوع
        </Button>
        <h1 className="text-xl font-black tracking-widest text-accent uppercase">المتجر</h1>
        <div className="w-10"></div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-6 flex justify-between items-center">
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">ذهبك</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-accent rounded-full shadow-[0_0_5px_hsl(var(--accent))]" />
          <span className="text-xl font-mono text-accent font-bold">{isLoading ? '...' : player?.gold || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ITEMS.map(item => (
          <div key={item.id} className="bg-background border border-border p-4 rounded-xl flex gap-4">
            <div className="w-16 h-16 bg-card rounded flex items-center justify-center border border-border/50 shrink-0">
              {item.type === 'consumable' ? (
                <div className="w-6 h-8 bg-red-500 rounded-b-full rounded-t-sm shadow-[0_0_10px_rgba(255,0,0,0.5)] relative overflow-hidden">
                  <div className="absolute top-0 w-full h-2 bg-white/30" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-slate-400 rotate-45 shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white leading-none mb-1">{item.name}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-mono text-accent">{item.price} ذ</span>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-secondary hover:bg-secondary/80 text-white px-4"
                  onClick={() => handlePurchase(item)}
                >
                  شراء
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
}
