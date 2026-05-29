import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { PageTransition } from '@/components/PageLayout';
import { useGetPlayer, getGetPlayerQueryKey, useRecordBattle } from '@workspace/api-client-react';
import { getTelegramUser } from '@/lib/telegram';
import { HeroArt } from '@/components/HeroArt';
import { MonsterArt } from '@/components/MonsterArt';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

// Base stats
const HERO_BASE = {
  warrior: { hp: 1000, atk: 150, def: 80, skill: 'Sword Slash' },
  mage: { hp: 700, atk: 220, def: 40, skill: 'Fireball' },
  assassin: { hp: 800, atk: 200, def: 50, skill: 'Shadow Strike' }
};

const MONSTERS = [
  { name: 'Slime', hp: 200, atk: 30, exp: 20, gold: 10 },
  { name: 'Goblin', hp: 400, atk: 60, exp: 50, gold: 25 },
  { name: 'Orc', hp: 700, atk: 100, exp: 100, gold: 50 },
  { name: 'Dragon', hp: 1500, atk: 180, exp: 250, gold: 120 },
  { name: 'Demon Lord', hp: 3000, atk: 250, exp: 500, gold: 250 }
];

export default function Battle() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const tgUser = useMemo(() => getTelegramUser(), []);

  const { data: player, isLoading } = useGetPlayer(
    { telegram_id: tgUser.telegram_id },
    { query: { enabled: !!tgUser.telegram_id, queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) } }
  );

  const recordBattleMut = useRecordBattle({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey({ telegram_id: tgUser.telegram_id }) });
      }
    }
  });

  // Battle State
  const [inBattle, setInBattle] = useState(false);
  const [heroState, setHeroState] = useState({ hp: 0, maxHp: 0, defBonus: 0, items: 3 });
  const [monsterState, setMonsterState] = useState({ name: '', hp: 0, maxHp: 0, atk: 0, exp: 0, gold: 0 });
  
  // Animation triggers
  const [heroAnim, setHeroAnim] = useState('');
  const [monsterAnim, setMonsterAnim] = useState('');
  const [floatingDmg, setFloatingDmg] = useState<{id: number, val: number, target: 'hero'|'monster'}[]>([]);
  const dmgIdRef = useRef(0);

  // Turn management
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [result, setResult] = useState<'win'|'lose'|null>(null);

  const log = (msg: string) => setBattleLog(prev => [msg, ...prev].slice(0, 5));

  const spawnDmg = (val: number, target: 'hero'|'monster') => {
    const id = dmgIdRef.current++;
    setFloatingDmg(prev => [...prev, { id, val, target }]);
    setTimeout(() => {
      setFloatingDmg(prev => prev.filter(d => d.id !== id));
    }, 1000);
  };

  useEffect(() => {
    if (player && player.hero_type && !inBattle && !result) {
      // Init battle
      const level = player.level || 1;
      const monsterIdx = Math.min(Math.floor((level - 1) / 2), MONSTERS.length - 1);
      const template = MONSTERS[monsterIdx];
      
      // Scaling monster
      const scale = 1 + (level * 0.1);
      const mHp = Math.floor(template.hp * scale);
      const mAtk = Math.floor(template.atk * scale);
      
      setMonsterState({
        name: template.name,
        hp: mHp, maxHp: mHp, atk: mAtk,
        exp: template.exp, gold: template.gold
      });

      // Init hero
      const hBase = HERO_BASE[player.hero_type as keyof typeof HERO_BASE] || HERO_BASE.warrior;
      const hScale = 1 + ((player.hero_level || 1) * 0.15);
      const hHp = Math.floor(hBase.hp * hScale);
      
      setHeroState({ hp: hHp, maxHp: hHp, defBonus: 0, items: 3 });
      setInBattle(true);
      setBattleLog(['A wild monster appears!']);
    }
  }, [player, inBattle, result]);

  // Monster Turn Logic
  useEffect(() => {
    if (!isPlayerTurn && inBattle && result === null) {
      const timer = setTimeout(() => {
        setMonsterAnim('animate-attack-lunge-reverse');
        setTimeout(() => setMonsterAnim(''), 300);

        const hBase = HERO_BASE[(player?.hero_type || 'warrior') as keyof typeof HERO_BASE];
        const hScale = 1 + ((player?.hero_level || 1) * 0.15);
        const def = Math.floor(hBase.def * hScale) + heroState.defBonus;
        
        let dmg = Math.floor(monsterState.atk * (100 / (100 + def)));
        dmg = Math.max(1, Math.floor(dmg * (0.8 + Math.random() * 0.4))); // variance
        
        spawnDmg(dmg, 'hero');
        setHeroAnim('animate-shake');
        setTimeout(() => setHeroAnim(''), 400);

        setHeroState(prev => {
          const nextHp = Math.max(0, prev.hp - dmg);
          if (nextHp === 0) {
            setResult('lose');
            endBattle('lose');
          }
          return { ...prev, hp: nextHp, defBonus: 0 }; // reset def bonus
        });
        
        log(`${monsterState.name} attacks for ${dmg} damage!`);
        setIsPlayerTurn(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, inBattle, result, monsterState, heroState.defBonus, player]);

  const endBattle = (res: 'win'|'lose') => {
    setInBattle(false);
    recordBattleMut.mutate({
      data: {
        telegram_id: tgUser.telegram_id,
        monster_name: monsterState.name,
        result: res,
        exp_gained: res === 'win' ? monsterState.exp : 0,
        gold_gained: res === 'win' ? monsterState.gold : 0
      }
    });
  };

  const handleAction = (type: 'attack'|'skill'|'defend'|'item') => {
    if (!isPlayerTurn || result) return;

    const hBase = HERO_BASE[(player?.hero_type || 'warrior') as keyof typeof HERO_BASE];
    const hScale = 1 + ((player?.hero_level || 1) * 0.15);
    const atk = Math.floor(hBase.atk * hScale);

    if (type === 'attack') {
      setHeroAnim('animate-attack-lunge');
      setTimeout(() => setHeroAnim(''), 300);

      let dmg = Math.max(1, Math.floor(atk * (0.8 + Math.random() * 0.4)));
      
      setTimeout(() => {
        setMonsterAnim('animate-shake');
        setTimeout(() => setMonsterAnim(''), 400);
        spawnDmg(dmg, 'monster');
        setMonsterState(prev => {
          const nextHp = Math.max(0, prev.hp - dmg);
          if (nextHp === 0) {
            setResult('win');
            endBattle('win');
          }
          return { ...prev, hp: nextHp };
        });
        log(`You attack for ${dmg} damage!`);
        if (result === null) setIsPlayerTurn(false);
      }, 200);

    } else if (type === 'skill') {
      setHeroAnim('animate-skill-pulse');
      setTimeout(() => setHeroAnim(''), 1000);
      
      let dmg = Math.max(1, Math.floor((atk * 2.5) * (0.8 + Math.random() * 0.4)));
      
      setTimeout(() => {
        setMonsterAnim('animate-shake');
        setTimeout(() => setMonsterAnim(''), 400);
        spawnDmg(dmg, 'monster');
        setMonsterState(prev => {
          const nextHp = Math.max(0, prev.hp - dmg);
          if (nextHp === 0) {
            setResult('win');
            endBattle('win');
          }
          return { ...prev, hp: nextHp };
        });
        log(`You used ${hBase.skill} for ${dmg} damage!`);
        if (result === null) setIsPlayerTurn(false);
      }, 800);

    } else if (type === 'defend') {
      const defBonus = Math.floor(hBase.def * hScale * 0.5);
      setHeroState(prev => ({ ...prev, defBonus }));
      log(`You brace for impact. DEF increased.`);
      setIsPlayerTurn(false);

    } else if (type === 'item') {
      if (heroState.items <= 0) {
        log(`No items left!`);
        return;
      }
      const heal = Math.floor(heroState.maxHp * 0.2);
      setHeroState(prev => ({ 
        ...prev, 
        hp: Math.min(prev.maxHp, prev.hp + heal),
        items: prev.items - 1
      }));
      log(`Used potion. Recovered ${heal} HP.`);
      setIsPlayerTurn(false);
    }
  };

  if (isLoading || (!player?.hero_type && !result)) {
    return (
      <PageTransition className="justify-center items-center p-6 text-center">
        <h2 className="text-xl font-black text-white mb-4">You need a hero to fight!</h2>
        <Button onClick={() => setLocation('/heroes')} className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest border border-red-500">Go to Summoning</Button>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="bg-[hsl(260,30%,5%)] relative overflow-hidden">
      {/* Background env */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/40 via-background to-black pointer-events-none" />
      
      {/* Header */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setLocation('/')} disabled={inBattle && !result}>
          Run Away
        </Button>
        <div className="text-xs font-black tracking-widest text-muted-foreground uppercase text-center">
          Turn: <span className={isPlayerTurn ? 'text-accent' : 'text-primary'}>{isPlayerTurn ? 'Player' : 'Enemy'}</span>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="flex-1 flex flex-col justify-center items-center relative z-10 px-6 mt-10">
        
        {/* Monster Side */}
        <div className="w-full flex flex-col items-center justify-end h-48 mb-8 relative">
          <div className="w-48 text-center mb-2">
            <div className="text-sm font-bold text-white mb-1 uppercase tracking-wider">{monsterState.name}</div>
            <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-border">
              <div 
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${Math.max(0, (monsterState.hp / (monsterState.maxHp || 1)) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">{monsterState.hp} / {monsterState.maxHp}</div>
          </div>
          
          <div className={`relative ${monsterAnim}`}>
            <MonsterArt name={monsterState.name} className="scale-125" />
            {floatingDmg.filter(d => d.target === 'monster').map(d => (
              <div key={d.id} className="absolute inset-0 flex items-center justify-center pointer-events-none animate-float-damage z-50">
                <span className="text-3xl font-black text-white" style={{ textShadow: '0 0 5px red, 0 0 10px black' }}>{d.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Side */}
        <div className="w-full flex flex-col items-center justify-start h-48 relative">
          <div className={`relative mb-6 ${heroAnim}`}>
            <HeroArt type={player?.hero_type} className="scale-125" />
            {floatingDmg.filter(d => d.target === 'hero').map(d => (
              <div key={d.id} className="absolute inset-0 flex items-center justify-center pointer-events-none animate-float-damage z-50">
                <span className="text-3xl font-black text-red-500" style={{ textShadow: '0 0 5px black' }}>{d.val}</span>
              </div>
            ))}
          </div>

          <div className="w-48 text-center">
             <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-border shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${Math.max(0, (heroState.hp / (heroState.maxHp || 1)) * 100)}%` }}
              />
            </div>
            <div className="text-xs font-bold text-white mt-1">{heroState.hp} / {heroState.maxHp}</div>
          </div>
        </div>

      </div>

      {/* Battle Log & Controls */}
      <div className="bg-card/90 backdrop-blur-md border-t border-border p-4 relative z-20">
        <div className="h-16 mb-4 overflow-hidden flex flex-col-reverse">
          {battleLog.map((msg, i) => (
            <div key={i} className={`text-xs ${i === 0 ? 'text-white font-bold' : 'text-muted-foreground'} mb-1`}>{msg}</div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            className="h-12 bg-primary hover:bg-primary/80 text-white font-bold border border-red-500 shadow-[0_0_10px_rgba(139,0,0,0.3)]"
            onClick={() => handleAction('attack')}
            disabled={!isPlayerTurn || result !== null}
          >
            ATTACK
          </Button>
          <Button 
            className="h-12 bg-secondary hover:bg-secondary/80 text-white font-bold border border-secondary/50"
            onClick={() => handleAction('skill')}
            disabled={!isPlayerTurn || result !== null}
          >
            SKILL
          </Button>
          <Button 
            variant="outline"
            className="h-10 bg-transparent border-muted text-muted-foreground hover:text-white"
            onClick={() => handleAction('defend')}
            disabled={!isPlayerTurn || result !== null}
          >
            DEFEND
          </Button>
          <Button 
            variant="outline"
            className="h-10 bg-transparent border-muted text-muted-foreground hover:text-white flex justify-between px-4"
            onClick={() => handleAction('item')}
            disabled={!isPlayerTurn || result !== null || heroState.items <= 0}
          >
            <span>ITEM</span>
            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-white">{heroState.items}</span>
          </Button>
        </div>
      </div>

      {/* Result Overlay */}
      {result && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <h2 className={`text-5xl font-black uppercase tracking-widest mb-2 ${result === 'win' ? 'text-accent' : 'text-primary'}`} style={{ textShadow: `0 0 20px ${result === 'win' ? 'rgba(240,192,64,0.5)' : 'rgba(139,0,0,0.8)'}` }}>
            {result === 'win' ? 'VICTORY' : 'DEFEATED'}
          </h2>
          
          {result === 'win' ? (
            <div className="bg-card border border-border p-6 rounded-xl w-full max-w-xs text-center my-8">
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Rewards</div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-white font-bold">EXP</span>
                <span className="text-green-400 font-mono text-xl">+{monsterState.exp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">Gold</span>
                <span className="text-accent font-mono text-xl">+{monsterState.gold}</span>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground my-8 text-center px-4">
              Your hero falls. Gather your strength and try again.
            </div>
          )}

          <Button 
            className="w-full max-w-xs h-14 bg-white hover:bg-white/90 text-black font-black uppercase tracking-widest"
            onClick={() => setLocation('/')}
            disabled={recordBattleMut.isPending}
          >
            {recordBattleMut.isPending ? 'Recording...' : 'Return'}
          </Button>
        </div>
      )}
    </PageTransition>
  );
}
