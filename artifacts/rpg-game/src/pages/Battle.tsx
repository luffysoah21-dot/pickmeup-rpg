import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '@/components/PageLayout';
import { useGetPlayer, getGetPlayerQueryKey, useRecordBattle } from '@workspace/api-client-react';
import { getTelegramUser } from '@/lib/telegram';
import { HeroArt } from '@/components/HeroArt';
import { MonsterArt } from '@/components/MonsterArt';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

const HERO_BASE = {
  warrior: { hp: 1000, atk: 150, def: 80,  skill: 'ضربة السيف' },
  mage:    { hp: 700,  atk: 220, def: 40,  skill: 'كرة النار'  },
  assassin:{ hp: 800,  atk: 200, def: 50,  skill: 'ضربة الظل'  },
};

const MONSTERS = [
  { name: 'Slime',      arName: 'الوحل',        emoji: '🟢', hp: 200,  atk: 30,  exp: 20,  gold: 10  },
  { name: 'Goblin',     arName: 'الغوبلن',      emoji: '👺', hp: 400,  atk: 60,  exp: 50,  gold: 25  },
  { name: 'Orc',        arName: 'الأورك',        emoji: '👹', hp: 700,  atk: 100, exp: 100, gold: 50  },
  { name: 'Dragon',     arName: 'التنين',        emoji: '🐉', hp: 1500, atk: 180, exp: 250, gold: 120 },
  { name: 'Demon Lord', arName: 'سيد الشياطين', emoji: '😈', hp: 3000, atk: 250, exp: 500, gold: 250 },
];

type BattleResult = 'win' | 'lose' | null;
interface FloatingDmg { id: number; val: number; target: 'hero' | 'monster'; isCrit?: boolean }
interface HeroState    { hp: number; maxHp: number; defBonus: number; items: number }
interface MonsterState { name: string; arName: string; emoji: string; hp: number; maxHp: number; atk: number; exp: number; gold: number }

const CRIT_CHANCE  = 0.15;
const CRIT_MULT    = 1.8;

export default function Battle() {
  const [, setLocation] = useLocation();
  const queryClient     = useQueryClient();
  const tgUser          = useMemo(() => getTelegramUser(), []);

  const { data: player, isLoading } = useGetPlayer(
    { telegram_id: tgUser.telegram_id },
    { query: { enabled: !!tgUser.telegram_id, queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) } }
  );

  const recordBattleMut = useRecordBattle({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) });
      },
    },
  });

  const [inBattle,      setInBattle]      = useState(false);
  const [heroState,     setHeroState]     = useState<HeroState>({ hp: 0, maxHp: 0, defBonus: 0, items: 3 });
  const [monsterState,  setMonsterState]  = useState<MonsterState>({ name: '', arName: '', emoji: '', hp: 0, maxHp: 0, atk: 0, exp: 0, gold: 0 });
  const [heroAnim,      setHeroAnim]      = useState('');
  const [monsterAnim,   setMonsterAnim]   = useState('');
  const [floatingDmg,   setFloatingDmg]  = useState<FloatingDmg[]>([]);
  const [isPlayerTurn,  setIsPlayerTurn]  = useState(true);
  const [battleLog,     setBattleLog]    = useState<string[]>([]);
  const [result,        setResult]       = useState<BattleResult>(null);
  const [comboCount,    setComboCount]   = useState(0);
  const [showCritFlash, setShowCritFlash] = useState(false);

  const resultRef  = useRef<BattleResult>(null);
  const comboRef   = useRef(0);
  useEffect(() => { resultRef.current = result; }, [result]);
  useEffect(() => { comboRef.current = comboCount; }, [comboCount]);

  const dmgIdRef = useRef(0);

  const log = useCallback((msg: string) => {
    setBattleLog(prev => [msg, ...prev].slice(0, 5));
  }, []);

  const spawnDmg = useCallback((val: number, target: 'hero' | 'monster', isCrit = false) => {
    const id = dmgIdRef.current++;
    setFloatingDmg(prev => [...prev, { id, val, target, isCrit }]);
    setTimeout(() => setFloatingDmg(prev => prev.filter(d => d.id !== id)), 1100);
  }, []);

  const endBattle = useCallback((res: 'win' | 'lose', monster: MonsterState) => {
    setInBattle(false);
    recordBattleMut.mutate({
      data: {
        telegram_id: tgUser.telegram_id,
        monster_name: monster.name,
        result: res,
        exp_gained: res === 'win' ? monster.exp : 0,
        gold_gained: res === 'win' ? monster.gold : 0,
      },
    });
  }, [tgUser.telegram_id, recordBattleMut]);

  // Initialize battle
  useEffect(() => {
    if (player?.hero_type && !inBattle && resultRef.current === null) {
      const level      = player.level || 1;
      const monsterIdx = Math.min(Math.floor((level - 1) / 2), MONSTERS.length - 1);
      const template   = MONSTERS[monsterIdx];
      const scale      = 1 + level * 0.1;
      const mHp        = Math.floor(template.hp * scale);
      const mAtk       = Math.floor(template.atk * scale);

      setMonsterState({ ...template, hp: mHp, maxHp: mHp, atk: mAtk });

      const hBase  = HERO_BASE[player.hero_type as keyof typeof HERO_BASE] ?? HERO_BASE.warrior;
      const hScale = 1 + (player.hero_level || 1) * 0.15;
      const hHp    = Math.floor(hBase.hp * hScale);

      setHeroState({ hp: hHp, maxHp: hHp, defBonus: 0, items: 3 });
      setIsPlayerTurn(true);
      setComboCount(0);
      setBattleLog([`${template.emoji} ظهر ${template.arName}!`]);
      setResult(null);
      setInBattle(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  // Monster turn
  useEffect(() => {
    if (isPlayerTurn || !inBattle || resultRef.current !== null) return;

    const timer = setTimeout(() => {
      if (resultRef.current !== null) return;

      setMonsterAnim('animate-attack-lunge-reverse');
      setTimeout(() => setMonsterAnim(''), 300);

      const hBase  = HERO_BASE[(player?.hero_type ?? 'warrior') as keyof typeof HERO_BASE];
      const hScale = 1 + (player?.hero_level ?? 1) * 0.15;
      const def    = Math.floor(hBase.def * hScale);

      setHeroState(prev => {
        const effectiveDef = def + prev.defBonus;
        let dmg = Math.floor(monsterState.atk * (100 / (100 + effectiveDef)));
        dmg = Math.max(1, Math.floor(dmg * (0.8 + Math.random() * 0.4)));

        spawnDmg(dmg, 'hero');
        setHeroAnim('animate-shake');
        setTimeout(() => setHeroAnim(''), 400);
        log(`${monsterState.emoji} ${monsterState.arName} يهاجمك بـ ${dmg} ضرر!`);

        const nextHp = Math.max(0, prev.hp - dmg);
        return { ...prev, hp: nextHp, defBonus: 0 };
      });

      setIsPlayerTurn(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPlayerTurn, inBattle, monsterState, player, spawnDmg, log]);

  // Hero HP = 0 → lose
  useEffect(() => {
    if (heroState.hp === 0 && inBattle && resultRef.current === null) {
      setResult('lose');
      setInBattle(false);
      endBattle('lose', monsterState);
    }
  }, [heroState.hp, inBattle, monsterState, endBattle]);

  const handleAction = useCallback((type: 'attack' | 'skill' | 'defend' | 'item') => {
    if (!isPlayerTurn || resultRef.current !== null) return;

    const hBase  = HERO_BASE[(player?.hero_type ?? 'warrior') as keyof typeof HERO_BASE];
    const hScale = 1 + (player?.hero_level ?? 1) * 0.15;
    const atk    = Math.floor(hBase.atk * hScale);

    if (type === 'attack') {
      const isCrit = Math.random() < CRIT_CHANCE;
      const mult   = isCrit ? CRIT_MULT : 1;
      const dmg    = Math.max(1, Math.floor(atk * mult * (0.8 + Math.random() * 0.4)));
      const newCombo = comboRef.current + 1;

      setHeroAnim('animate-attack-lunge');
      setTimeout(() => setHeroAnim(''), 300);

      setTimeout(() => {
        if (resultRef.current !== null) return;
        setMonsterAnim('animate-shake');
        setTimeout(() => setMonsterAnim(''), 400);
        spawnDmg(dmg, 'monster', isCrit);

        if (isCrit) {
          setShowCritFlash(true);
          setTimeout(() => setShowCritFlash(false), 600);
          log(`⚡ ضربة حاسمة! x${newCombo} كومبو — ${dmg} ضرر!`);
        } else if (newCombo >= 3) {
          log(`🔥 كومبو x${newCombo}! تهاجم بـ ${dmg} ضرر!`);
        } else {
          log(`تهاجم بـ ${dmg} ضرر!`);
        }

        setComboCount(newCombo);
        setMonsterState(prev => ({ ...prev, hp: Math.max(0, prev.hp - dmg) }));
        setIsPlayerTurn(false);
      }, 200);

    } else if (type === 'skill') {
      const isCrit = Math.random() < CRIT_CHANCE;
      const mult   = isCrit ? CRIT_MULT : 1;
      const dmg    = Math.max(1, Math.floor(atk * 2.5 * mult * (0.8 + Math.random() * 0.4)));

      setHeroAnim('animate-skill-pulse');
      setTimeout(() => setHeroAnim(''), 1000);

      setTimeout(() => {
        if (resultRef.current !== null) return;
        setMonsterAnim('animate-shake');
        setTimeout(() => setMonsterAnim(''), 400);
        spawnDmg(dmg, 'monster', isCrit);

        if (isCrit) {
          setShowCritFlash(true);
          setTimeout(() => setShowCritFlash(false), 600);
          log(`⚡ مهارة حاسمة! ${hBase.skill} — ${dmg} ضرر!`);
        } else {
          log(`استخدمت ${hBase.skill} — ${dmg} ضرر!`);
        }

        setComboCount(0);
        setMonsterState(prev => ({ ...prev, hp: Math.max(0, prev.hp - dmg) }));
        setIsPlayerTurn(false);
      }, 800);

    } else if (type === 'defend') {
      const defBonus = Math.floor(hBase.def * hScale * 0.5);
      setHeroState(prev => ({ ...prev, defBonus }));
      setComboCount(0);
      log('🛡️ تتخذ موقفاً دفاعياً!');
      setIsPlayerTurn(false);

    } else if (type === 'item') {
      if (heroState.items <= 0) { log('لا توجد عناصر متبقية!'); return; }
      const heal = Math.floor(heroState.maxHp * 0.2);
      setHeroState(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + heal), items: prev.items - 1 }));
      setComboCount(0);
      log(`🧪 استخدمت جرعة — استعدت ${heal} صحة!`);
      setIsPlayerTurn(false);
    }
  }, [isPlayerTurn, player, heroState.items, heroState.maxHp, spawnDmg, log]);

  // Monster HP = 0 → win
  useEffect(() => {
    if (monsterState.hp === 0 && inBattle && resultRef.current === null) {
      setResult('win');
      setInBattle(false);
      endBattle('win', monsterState);
    }
  }, [monsterState.hp, inBattle, monsterState, endBattle]);

  if (isLoading) {
    return (
      <PageTransition className="justify-center items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin" />
        <div className="mt-4 text-accent font-bold tracking-widest">جاري الاستدعاء...</div>
      </PageTransition>
    );
  }

  if (!player?.hero_type && !result) {
    return (
      <PageTransition className="justify-center items-center p-6 text-center">
        <h2 className="text-xl font-black text-white mb-4">تحتاج إلى بطل للقتال!</h2>
        <Button onClick={() => setLocation('/heroes')} className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest border border-red-500">
          اذهب إلى الاستدعاء
        </Button>
      </PageTransition>
    );
  }

  const hpPercent      = Math.max(0, (heroState.hp / (heroState.maxHp || 1)) * 100);
  const monsterPercent = Math.max(0, (monsterState.hp / (monsterState.maxHp || 1)) * 100);

  return (
    <PageTransition className="bg-[hsl(260,30%,5%)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/40 via-background to-black pointer-events-none" />

      {/* Crit flash overlay */}
      {showCritFlash && (
        <div className="absolute inset-0 z-40 pointer-events-none animate-in fade-in duration-100"
          style={{ background: 'radial-gradient(ellipse at center, rgba(250,200,0,0.25) 0%, transparent 70%)' }} />
      )}

      {/* Header */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setLocation('/')} disabled={inBattle && !result}>
          هروب
        </Button>
        <div className="flex items-center gap-3">
          {comboCount >= 2 && (
            <div className="flex items-center gap-1 bg-accent/20 border border-accent/50 rounded-full px-2 py-0.5 animate-in slide-in-from-top-2 duration-200">
              <span className="text-accent font-black text-xs">x{comboCount}</span>
              <span className="text-[10px] text-accent/80">كومبو</span>
            </div>
          )}
          <div className="text-xs font-black tracking-widest text-muted-foreground">
            الدور: <span className={isPlayerTurn ? 'text-accent' : 'text-primary'}>{isPlayerTurn ? 'اللاعب' : 'العدو'}</span>
          </div>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="flex-1 flex flex-col justify-center items-center relative z-10 px-6 mt-14">

        {/* Monster */}
        <div className="w-full flex flex-col items-center justify-end h-52 mb-4 relative">
          <div className="w-52 text-center mb-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 6px rgba(255,100,0,0.6))' }}>
                {monsterState.emoji}
              </span>
              <span className="text-sm font-black text-white uppercase tracking-wider">{monsterState.arName}</span>
            </div>
            <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-border">
              <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${monsterPercent}%` }} />
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{monsterState.hp} / {monsterState.maxHp}</div>
          </div>
          <div className={`relative ${monsterAnim}`}>
            <MonsterArt name={monsterState.name} className="scale-125" />
            {floatingDmg.filter(d => d.target === 'monster').map(d => (
              <div key={d.id} className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                style={{ animation: 'float-damage 1.1s ease-out forwards' }}>
                <span
                  className="font-black"
                  style={{
                    fontSize: d.isCrit ? '2.2rem' : '1.8rem',
                    color: d.isCrit ? '#fbbf24' : '#ffffff',
                    textShadow: d.isCrit
                      ? '0 0 8px #f59e0b, 0 0 20px #f59e0b, 0 0 4px #000'
                      : '0 0 5px red, 0 0 10px black',
                  }}
                >
                  {d.isCrit ? '⚡' : ''}{d.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero */}
        <div className="w-full flex flex-col items-center justify-start h-44 relative">
          <div className={`relative mb-4 ${heroAnim}`}>
            <HeroArt type={player?.hero_type} selected className="scale-125" />
            {floatingDmg.filter(d => d.target === 'hero').map(d => (
              <div key={d.id} className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                style={{ animation: 'float-damage 1.1s ease-out forwards' }}>
                <span className="text-3xl font-black text-red-400"
                  style={{ textShadow: '0 0 5px black, 0 0 8px rgba(220,0,0,0.8)' }}>
                  -{d.val}
                </span>
              </div>
            ))}
          </div>
          <div className="w-48 text-center">
            <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-border shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${hpPercent}%`,
                  background: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <div className="text-xs font-bold text-white mt-1 font-mono">{heroState.hp} / {heroState.maxHp}</div>
          </div>
        </div>
      </div>

      {/* Battle Log & Controls */}
      <div className="bg-card/90 backdrop-blur-md border-t border-border p-4 relative z-20">
        <div className="h-16 mb-4 overflow-hidden flex flex-col-reverse">
          {battleLog.map((msg, i) => (
            <div key={i} className={`text-xs ${i === 0 ? 'text-white font-bold' : 'text-muted-foreground'} mb-1 leading-tight`}>
              {msg}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="h-12 bg-primary hover:bg-primary/80 text-white font-bold border border-red-500 shadow-[0_0_10px_rgba(139,0,0,0.3)] flex flex-col gap-0.5"
            onClick={() => handleAction('attack')}
            disabled={!isPlayerTurn || result !== null}
          >
            <span>⚔️ هجوم</span>
            {comboCount >= 2 && <span className="text-[9px] text-accent/80">x{comboCount + 1} كومبو</span>}
          </Button>
          <Button
            className="h-12 bg-secondary hover:bg-secondary/80 text-white font-bold border border-secondary/50"
            onClick={() => handleAction('skill')}
            disabled={!isPlayerTurn || result !== null}
          >
            ✨ مهارة
          </Button>
          <Button
            variant="outline"
            className="h-10 bg-transparent border-muted text-muted-foreground hover:text-white"
            onClick={() => handleAction('defend')}
            disabled={!isPlayerTurn || result !== null}
          >
            🛡️ دفاع
          </Button>
          <Button
            variant="outline"
            className="h-10 bg-transparent border-muted text-muted-foreground hover:text-white flex justify-between px-4"
            onClick={() => handleAction('item')}
            disabled={!isPlayerTurn || result !== null || heroState.items <= 0}
          >
            <span>🧪 عنصر</span>
            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-white">{heroState.items}</span>
          </Button>
        </div>
      </div>

      {/* Result Overlay */}
      {result && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="text-6xl mb-2">{result === 'win' ? '🏆' : '💀'}</div>
          <h2
            className={`text-5xl font-black uppercase tracking-widest mb-2 ${result === 'win' ? 'text-accent' : 'text-primary'}`}
            style={{ textShadow: `0 0 20px ${result === 'win' ? 'rgba(240,192,64,0.6)' : 'rgba(139,0,0,0.8)'}` }}
          >
            {result === 'win' ? 'انتصار!' : 'هُزمت!'}
          </h2>
          {result === 'win' ? (
            <div className="bg-card border border-border p-6 rounded-xl w-full max-w-xs text-center my-6">
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-4">المكافآت</div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-white font-bold">✨ خبرة</span>
                <span className="text-green-400 font-mono text-xl font-black">+{monsterState.exp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">💰 ذهب</span>
                <span className="text-accent font-mono text-xl font-black">+{monsterState.gold}</span>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground my-8 text-center px-4">
              سقط بطلك. اجمع قوتك وحاول مجدداً.
            </div>
          )}
          <Button
            className="w-full max-w-xs h-14 bg-white hover:bg-white/90 text-black font-black uppercase tracking-widest"
            onClick={() => setLocation('/')}
            disabled={recordBattleMut.isPending}
          >
            {recordBattleMut.isPending ? 'جاري الحفظ...' : '🏠 العودة'}
          </Button>
        </div>
      )}
    </PageTransition>
  );
}
