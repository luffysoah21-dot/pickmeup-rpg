import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useSearch } from 'wouter';
import { PageTransition } from '@/components/PageLayout';
import { useGetPlayer, getGetPlayerQueryKey, useRecordBattle } from '@workspace/api-client-react';
import { getTelegramUser } from '@/lib/telegram';
import { HeroArt } from '@/components/HeroArt';
import { MonsterArt } from '@/components/MonsterArt';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { HERO_BASE_STATS, TOWER_FLOORS, getPlayerFloor, getFloorById } from '@/lib/game-data';
import type { MonsterDef, FloorDef } from '@/lib/game-data';

type BattleResult = 'win' | 'lose' | null;
interface FloatingDmg { id: number; val: number; target: 'hero' | 'monster'; isCrit?: boolean }
interface HeroState    { hp: number; maxHp: number; defBonus: number; items: number }
interface MonsterState extends MonsterDef { maxHp: number; curHp: number; scaledAtk: number }

const CRIT_CHANCE = 0.15;
const CRIT_MULT   = 1.8;

export default function Battle() {
  const [, setLocation] = useLocation();
  const search          = useSearch();
  const queryClient     = useQueryClient();
  const tgUser          = useMemo(() => getTelegramUser(), []);

  // Parse floor/boss from URL params
  const params  = useMemo(() => new URLSearchParams(search), [search]);
  const floorId = parseInt(params.get('floor') ?? '0') || 0;
  const isBossMode = params.get('boss') === '1';

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
  const [monsterState,  setMonsterState]  = useState<MonsterState | null>(null);
  const [floor,         setFloor]         = useState<FloorDef | null>(null);
  const [heroAnim,      setHeroAnim]      = useState('');
  const [monsterAnim,   setMonsterAnim]   = useState('');
  const [screenShake,   setScreenShake]   = useState(false);
  const [showCritText,  setShowCritText]  = useState(false);
  const [showCritFlash, setShowCritFlash] = useState(false);
  const [floatingDmg,   setFloatingDmg]  = useState<FloatingDmg[]>([]);
  const [isPlayerTurn,  setIsPlayerTurn]  = useState(true);
  const [battleLog,     setBattleLog]    = useState<string[]>([]);
  const [result,        setResult]       = useState<BattleResult>(null);
  const [comboCount,    setComboCount]   = useState(0);

  const resultRef = useRef<BattleResult>(null);
  const comboRef  = useRef(0);
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

  const endBattle = useCallback((res: 'win' | 'lose', m: MonsterState) => {
    setInBattle(false);
    recordBattleMut.mutate({
      data: {
        telegram_id: tgUser.telegram_id,
        monster_name: m.name,
        result: res,
        exp_gained: res === 'win' ? m.exp : 0,
        gold_gained: res === 'win' ? m.gold : 0,
      },
    });
  }, [tgUser.telegram_id, recordBattleMut]);

  const pickMonster = useCallback((f: FloorDef, level: number): MonsterDef => {
    if (isBossMode) return f.monsters.find(m => m.isBoss) ?? f.monsters[f.monsters.length - 1]!;
    const nonBoss = f.monsters.filter(m => !m.isBoss);
    return nonBoss[Math.floor(Math.random() * nonBoss.length)] ?? f.monsters[0]!;
  }, [isBossMode]);

  const initBattle = useCallback(() => {
    if (!player?.hero_type) return;
    const level     = player.level || 1;
    const theFloor  = floorId > 0 ? getFloorById(floorId) : getPlayerFloor(level);
    const template  = pickMonster(theFloor, level);
    const scale     = 1 + level * 0.08;
    const mHp       = Math.floor(template.hp * scale);
    const mAtk      = Math.floor(template.atk * scale);

    const hBase  = HERO_BASE_STATS[player.hero_type] ?? HERO_BASE_STATS.warrior!;
    const hScale = 1 + (player.hero_level || 1) * 0.15;
    const hHp    = Math.floor(hBase.hp * hScale);

    setFloor(theFloor);
    setMonsterState({ ...template, maxHp: mHp, curHp: mHp, scaledAtk: mAtk });
    setHeroState({ hp: hHp, maxHp: hHp, defBonus: 0, items: 3 });
    setIsPlayerTurn(true);
    setComboCount(0);
    setBattleLog([`${isBossMode ? '🎵' : ''}${template.emoji} ظهر ${template.arName}!`]);
    setResult(null);
    setFloatingDmg([]);
    setHeroAnim('');
    setMonsterAnim('');
    setScreenShake(false);
    setShowCritText(false);
    setShowCritFlash(false);
    setInBattle(true);
  }, [player, floorId, isBossMode, pickMonster]);

  useEffect(() => {
    if (player?.hero_type && !inBattle && resultRef.current === null) initBattle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  // Monster turn
  useEffect(() => {
    if (isPlayerTurn || !inBattle || resultRef.current !== null || !monsterState) return;
    const timer = setTimeout(() => {
      if (resultRef.current !== null) return;
      setMonsterAnim('animate-attack-lunge-reverse');
      setTimeout(() => setMonsterAnim(''), 300);

      const hBase  = HERO_BASE_STATS[(player?.hero_type ?? 'warrior')] ?? HERO_BASE_STATS.warrior!;
      const hScale = 1 + (player?.hero_level ?? 1) * 0.15;
      const def    = Math.floor(hBase.def * hScale);

      setHeroState(prev => {
        const eff = def + prev.defBonus;
        let dmg = Math.floor(monsterState.scaledAtk * (100 / (100 + eff)));
        dmg = Math.max(1, Math.floor(dmg * (0.8 + Math.random() * 0.4)));
        spawnDmg(dmg, 'hero');
        setScreenShake(true); setTimeout(() => setScreenShake(false), 500);
        setHeroAnim('animate-shake'); setTimeout(() => setHeroAnim(''), 400);
        log(`${monsterState.emoji} ${monsterState.arName} يهاجمك بـ ${dmg} ضرر!`);
        return { ...prev, hp: Math.max(0, prev.hp - dmg), defBonus: 0 };
      });
      setIsPlayerTurn(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isPlayerTurn, inBattle, monsterState, player, spawnDmg, log]);

  // Hero HP = 0 → lose
  useEffect(() => {
    if (heroState.hp === 0 && inBattle && resultRef.current === null && monsterState) {
      setResult('lose'); setInBattle(false); endBattle('lose', monsterState);
    }
  }, [heroState.hp, inBattle, monsterState, endBattle]);

  // Special skill effects by hero type
  const applySkillEffect = useCallback((heroType: string, atk: number, monsterHp: number) => {
    switch (heroType) {
      case 'shaman': {
        // Heal 30% + deal damage
        const heal = Math.floor((heroState.maxHp * 0.3));
        setHeroState(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + heal) }));
        const dmg = Math.max(1, Math.floor(atk * 1.5 * (0.8 + Math.random() * 0.4)));
        return { dmg, extraLog: `🌿 شفي ${heal} صحة و` };
      }
      case 'dark_knight': {
        // Life steal: deal damage and restore 40% of it
        const dmg = Math.max(1, Math.floor(atk * 2 * (0.8 + Math.random() * 0.4)));
        const steal = Math.floor(dmg * 0.4);
        setHeroState(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + steal) }));
        return { dmg, extraLog: `🌑 سرق ${steal} صحة و` };
      }
      case 'executioner': {
        // Double damage if enemy < 30% HP
        const lowHp = monsterHp / (monsterState?.maxHp ?? monsterHp) < 0.3;
        const mult  = lowHp ? 4 : 2;
        const dmg   = Math.max(1, Math.floor(atk * mult * (0.8 + Math.random() * 0.4)));
        return { dmg, extraLog: lowHp ? '💀 إعدام! ' : '' };
      }
      case 'thunder_goddess': {
        // Ignore defense: full atk * 3
        const dmg = Math.max(1, Math.floor(atk * 3 * (0.9 + Math.random() * 0.2)));
        return { dmg, extraLog: '⚡ تجاهل الدفاع! ' };
      }
      default: {
        const dmg = Math.max(1, Math.floor(atk * 2.5 * (0.8 + Math.random() * 0.4)));
        return { dmg, extraLog: '' };
      }
    }
  }, [heroState.maxHp, monsterState]);

  const handleAction = useCallback((type: 'attack' | 'skill' | 'defend' | 'item') => {
    if (!isPlayerTurn || resultRef.current !== null || !monsterState) return;
    const heroType = player?.hero_type ?? 'warrior';
    const hBase    = HERO_BASE_STATS[heroType] ?? HERO_BASE_STATS.warrior!;
    const hScale   = 1 + (player?.hero_level ?? 1) * 0.15;
    const atk      = Math.floor(hBase.atk * hScale);

    if (type === 'attack') {
      const isCrit   = Math.random() < CRIT_CHANCE;
      const mult     = isCrit ? CRIT_MULT : 1;
      const dmg      = Math.max(1, Math.floor(atk * mult * (0.8 + Math.random() * 0.4)));
      const newCombo = comboRef.current + 1;
      setHeroAnim('animate-attack-lunge');
      setTimeout(() => setHeroAnim(''), 300);
      setTimeout(() => {
        if (resultRef.current !== null) return;
        setMonsterAnim('animate-shake'); setTimeout(() => setMonsterAnim(''), 400);
        spawnDmg(dmg, 'monster', isCrit);
        if (isCrit) {
          setShowCritFlash(true); setShowCritText(true);
          setTimeout(() => setShowCritFlash(false), 600);
          setTimeout(() => setShowCritText(false), 1200);
          log(`⚡ ضربة حرجة! x${newCombo} كومبو — ${dmg} ضرر!`);
        } else if (newCombo >= 3) {
          log(`🔥 كومبو x${newCombo}! تهاجم بـ ${dmg} ضرر!`);
        } else {
          log(`تهاجم بـ ${dmg} ضرر!`);
        }
        setComboCount(newCombo);
        setMonsterState(prev => prev ? { ...prev, curHp: Math.max(0, prev.curHp - dmg) } : prev);
        setIsPlayerTurn(false);
      }, 200);

    } else if (type === 'skill') {
      const isCrit = Math.random() < CRIT_CHANCE;
      setHeroAnim('animate-skill-pulse');
      setTimeout(() => setHeroAnim(''), 1000);
      setTimeout(() => {
        if (resultRef.current !== null) return;
        const { dmg, extraLog } = applySkillEffect(heroType, atk, monsterState.curHp);
        const finalDmg = isCrit ? Math.floor(dmg * CRIT_MULT) : dmg;
        setMonsterAnim('animate-shake'); setTimeout(() => setMonsterAnim(''), 400);
        spawnDmg(finalDmg, 'monster', isCrit);
        if (isCrit) {
          setShowCritFlash(true); setShowCritText(true);
          setTimeout(() => setShowCritFlash(false), 600);
          setTimeout(() => setShowCritText(false), 1200);
        }
        log(`${extraLog}${isCrit ? '⚡' : ''}استخدمت ${hBase.skill} — ${finalDmg} ضرر!`);
        setComboCount(0);
        setMonsterState(prev => prev ? { ...prev, curHp: Math.max(0, prev.curHp - finalDmg) } : prev);
        setIsPlayerTurn(false);
      }, 800);

    } else if (type === 'defend') {
      const defBonus = Math.floor(hBase.def * hScale * 0.5);
      setHeroState(prev => ({ ...prev, defBonus }));
      setComboCount(0); log('🛡️ تتخذ موقفاً دفاعياً!'); setIsPlayerTurn(false);

    } else if (type === 'item') {
      if (heroState.items <= 0) { log('لا توجد عناصر متبقية!'); return; }
      const heal = Math.floor(heroState.maxHp * 0.2);
      setHeroState(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + heal), items: prev.items - 1 }));
      setComboCount(0); log(`🧪 استدعت جرعة — استعدت ${heal} صحة!`); setIsPlayerTurn(false);
    }
  }, [isPlayerTurn, player, heroState.items, heroState.maxHp, monsterState, spawnDmg, log, applySkillEffect]);

  // Monster HP = 0 → win
  useEffect(() => {
    if (monsterState && monsterState.curHp === 0 && inBattle && resultRef.current === null) {
      setResult('win'); setInBattle(false); endBattle('win', monsterState);
    }
  }, [monsterState?.curHp, inBattle, monsterState, endBattle]);

  if (isLoading) return (
    <PageTransition className="justify-center items-center">
      <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin" />
    </PageTransition>
  );

  if (!player?.hero_type && !result) return (
    <PageTransition className="justify-center items-center p-6 text-center">
      <h2 className="text-xl font-black text-white mb-4">تحتاج إلى بطل للقتال!</h2>
      <Button onClick={() => setLocation('/summon')} className="bg-primary text-white font-bold border border-red-500">
        ✨ استدعاء بطل
      </Button>
    </PageTransition>
  );

  const hpPercent      = heroState.maxHp > 0 ? Math.max(0, (heroState.hp / heroState.maxHp) * 100) : 0;
  const mHpPercent     = monsterState ? Math.max(0, (monsterState.curHp / monsterState.maxHp) * 100) : 0;
  const floorTheme     = floor;

  return (
    <PageTransition
      className={`relative overflow-hidden ${screenShake ? 'animate-screen-shake' : ''}`}
      style={{ background: floorTheme ? `linear-gradient(to bottom, ${floorTheme.bgFrom}, #000)` : undefined }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/30 via-background to-black pointer-events-none" />

      {/* Crit flash */}
      {showCritFlash && (
        <div className="absolute inset-0 z-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(250,200,0,0.22) 0%, transparent 70%)' }} />
      )}

      {/* Crit text */}
      {showCritText && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-crit-text text-center select-none">
            <div className="text-4xl font-black"
              style={{ color: '#fbbf24', textShadow: '0 0 20px #f59e0b, 0 0 40px #d97706, 0 0 4px #000' }}>
              ⚡ ضربة حرجة!
            </div>
          </div>
        </div>
      )}

      {/* Boss banner */}
      {isBossMode && monsterState?.isBoss && (
        <div className="absolute top-0 inset-x-0 z-20 text-center py-1 text-xs font-black tracking-widest"
          style={{ background: floorTheme?.borderColor ?? '#7c3aed', color: '#000' }}>
          🎵 معركة الزعيم — {floorTheme?.bossTitle}
        </div>
      )}

      {/* Header */}
      <div className={`absolute w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent ${isBossMode ? 'top-6' : 'top-0'}`}>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10"
          onClick={() => setLocation('/tower')} disabled={inBattle && !result}>
          البرج
        </Button>
        <div className="flex items-center gap-3">
          {comboCount >= 2 && (
            <div className="flex items-center gap-1 bg-accent/20 border border-accent/50 rounded-full px-2 py-0.5">
              <span className="text-accent font-black text-xs">x{comboCount}</span>
              <span className="text-[10px] text-accent/70">كومبو</span>
            </div>
          )}
          <div className="text-xs font-black tracking-widest text-muted-foreground">
            الدور: <span className={isPlayerTurn ? 'text-accent' : 'text-primary'}>{isPlayerTurn ? 'اللاعب' : 'العدو'}</span>
          </div>
        </div>
      </div>

      {/* Battle arena */}
      <div className={`flex-1 flex flex-col justify-center items-center relative z-10 px-6 ${isBossMode ? 'mt-20' : 'mt-16'}`}>
        {/* Monster */}
        <div className="w-full flex flex-col items-center h-52 mb-2">
          {monsterState && (
            <>
              <div className="text-center mb-2">
                <div className="text-5xl mb-1 leading-none"
                  style={{ filter: `drop-shadow(0 0 10px ${floorTheme?.glowColor ?? 'rgba(255,120,0,0.7)'})` }}>
                  {monsterState.emoji}
                  {monsterState.isBoss && <span className="text-2xl ms-1">👑</span>}
                </div>
                <div className="text-sm font-black text-white uppercase tracking-wider">{monsterState.arName}</div>
                <div className="w-52 mt-1">
                  <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-border">
                    <div className="h-full transition-all duration-300"
                      style={{ width: `${mHpPercent}%`, background: monsterState.isBoss ? '#dc2626' : '#ef4444' }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono text-center">
                    {monsterState.curHp} / {monsterState.maxHp}
                  </div>
                </div>
              </div>
              <div className={`relative ${monsterAnim}`}>
                <MonsterArt name={monsterState.name} className="scale-125" />
                {floatingDmg.filter(d => d.target === 'monster').map(d => (
                  <div key={d.id} className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                    style={{ animation: 'float-damage 1.1s ease-out forwards' }}>
                    <span className="font-black"
                      style={{ fontSize: d.isCrit ? '2.4rem' : '1.8rem', color: d.isCrit ? '#fbbf24' : '#fff',
                        textShadow: d.isCrit ? '0 0 10px #f59e0b,0 0 24px #f59e0b' : '0 0 5px red,0 0 10px black' }}>
                      {d.isCrit ? '⚡' : ''}{d.val}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Hero */}
        <div className="w-full flex flex-col items-center h-40">
          <div className={`relative mb-3 ${heroAnim}`}>
            <HeroArt type={player?.hero_type} selected className="scale-125" />
            {floatingDmg.filter(d => d.target === 'hero').map(d => (
              <div key={d.id} className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                style={{ animation: 'float-damage 1.1s ease-out forwards' }}>
                <span className="text-3xl font-black text-red-400"
                  style={{ textShadow: '0 0 5px black,0 0 8px rgba(220,0,0,0.8)' }}>-{d.val}</span>
              </div>
            ))}
          </div>
          <div className="w-48 text-center">
            <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-border">
              <div className="h-full transition-all duration-300"
                style={{ width: `${hpPercent}%`,
                  background: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#ef4444' }} />
            </div>
            <div className="text-xs font-bold text-white mt-1 font-mono">{heroState.hp} / {heroState.maxHp}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card/90 backdrop-blur-md border-t border-border p-4 relative z-20">
        <div className="h-14 mb-3 overflow-hidden flex flex-col-reverse">
          {battleLog.map((msg, i) => (
            <div key={i} className={`text-xs ${i === 0 ? 'text-white font-bold' : 'text-muted-foreground'} mb-1 leading-tight`}>
              {msg}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button className="h-12 bg-primary hover:bg-primary/80 text-white font-bold border border-red-500 flex flex-col gap-0.5"
            onClick={() => handleAction('attack')} disabled={!isPlayerTurn || result !== null}>
            <span>⚔️ هجوم</span>
            {comboCount >= 2 && <span className="text-[9px] text-accent/80">x{comboCount + 1} كومبو</span>}
          </Button>
          <Button className="h-12 bg-secondary hover:bg-secondary/80 text-white font-bold border border-secondary/50"
            onClick={() => handleAction('skill')} disabled={!isPlayerTurn || result !== null}>
            ✨ مهارة
          </Button>
          <Button variant="outline" className="h-10 bg-transparent border-muted text-muted-foreground hover:text-white"
            onClick={() => handleAction('defend')} disabled={!isPlayerTurn || result !== null}>
            🛡️ دفاع
          </Button>
          <Button variant="outline" className="h-10 bg-transparent border-muted text-muted-foreground hover:text-white flex justify-between px-4"
            onClick={() => handleAction('item')} disabled={!isPlayerTurn || result !== null || heroState.items <= 0}>
            <span>🧪 عنصر</span>
            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-white">{heroState.items}</span>
          </Button>
        </div>
      </div>

      {/* Result overlay */}
      {result && monsterState && (
        <div className="absolute inset-0 bg-black/85 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="text-7xl mb-3">{result === 'win' ? (monsterState.isBoss ? '🏆👑' : '🏆') : '💀'}</div>
          <h2 className={`text-5xl font-black uppercase tracking-widest mb-2 ${result === 'win' ? 'text-accent' : 'text-primary'}`}
            style={{ textShadow: `0 0 24px ${result === 'win' ? 'rgba(240,192,64,0.7)' : 'rgba(139,0,0,0.9)'}` }}>
            {result === 'win' ? (monsterState.isBoss ? 'قهرت الزعيم!' : 'انتصار!') : 'هُزمت!'}
          </h2>

          {result === 'win' ? (
            <div className="bg-card border border-border p-5 rounded-xl w-full max-w-xs text-center my-5">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-4">المكافآت</div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-white font-bold">✨ خبرة</span>
                <span className="text-green-400 font-mono text-2xl font-black">+{monsterState.exp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">💰 ذهب</span>
                <span className="text-accent font-mono text-2xl font-black">+{monsterState.gold}</span>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground my-5 text-center px-4 text-sm">
              سقط بطلك. اجمع قوتك وحاول مجدداً.
            </div>
          )}

          <div className="w-full max-w-xs flex flex-col gap-3">
            <Button
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-base uppercase tracking-widest border border-red-500"
              onClick={initBattle} disabled={recordBattleMut.isPending}>
              {recordBattleMut.isPending ? '...' : '⚔️ العب مجدداً'}
            </Button>
            <Button variant="outline"
              className="w-full h-10 bg-transparent border-white/30 text-white/80 hover:bg-white/10 font-bold"
              onClick={() => setLocation('/tower')} disabled={recordBattleMut.isPending}>
              🗺️ البرج
            </Button>
            <Button variant="outline"
              className="w-full h-10 bg-transparent border-white/20 text-white/60 hover:bg-white/10 text-sm"
              onClick={() => setLocation('/')} disabled={recordBattleMut.isPending}>
              🏠 القائمة الرئيسية
            </Button>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
