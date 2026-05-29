import React from 'react';

/* ─── Emoji-based hero avatar cards ─────────────────────────────────────── */

interface HeroCardProps {
  emoji: string;
  subEmoji?: string;
  label: string;
  selected?: boolean;
  bgStyle: React.CSSProperties;
  glowColor: string;
  className?: string;
}

const HeroCard = ({ emoji, subEmoji, label, selected, bgStyle, glowColor, className = '' }: HeroCardProps) => (
  <div
    className={`relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl overflow-hidden ${className}`}
    style={{
      ...bgStyle,
      border: `2px solid ${glowColor}`,
      boxShadow: selected
        ? `0 0 20px 6px ${glowColor}, inset 0 0 20px rgba(0,0,0,0.4)`
        : `0 0 8px 2px ${glowColor}66, inset 0 0 12px rgba(0,0,0,0.5)`,
      animation: selected ? 'hero-card-glow 2s ease-in-out infinite' : undefined,
    }}
  >
    {/* Background shimmer */}
    <div
      className="absolute inset-0 opacity-30"
      style={{
        background: `radial-gradient(circle at 50% 30%, ${glowColor}55, transparent 70%)`,
      }}
    />
    {/* Main emoji */}
    <span className="text-3xl leading-none relative z-10 drop-shadow-lg"
      style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}>
      {emoji}
    </span>
    {/* Sub emoji badge */}
    {subEmoji && (
      <span className="absolute bottom-1 right-1 text-sm leading-none"
        style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}>
        {subEmoji}
      </span>
    )}
    {/* Selected indicator */}
    {selected && (
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${glowColor}22 0%, transparent 60%)`,
        }}
      />
    )}
  </div>
);

export const WarriorArt = ({ selected, className = '' }: { selected?: boolean; className?: string }) => (
  <HeroCard
    emoji="⚔️"
    subEmoji="🛡️"
    label="محارب"
    selected={selected}
    bgStyle={{ background: 'linear-gradient(145deg, #1a1000 0%, #2d1b00 60%, #1a0a00 100%)' }}
    glowColor="#f0c040"
    className={className}
  />
);

export const MageArt = ({ selected, className = '' }: { selected?: boolean; className?: string }) => (
  <HeroCard
    emoji="🔮"
    subEmoji="✨"
    label="ساحر"
    selected={selected}
    bgStyle={{ background: 'linear-gradient(145deg, #050a2e 0%, #0d1560 60%, #050a2e 100%)' }}
    glowColor="#60a5fa"
    className={className}
  />
);

export const AssassinArt = ({ selected, className = '' }: { selected?: boolean; className?: string }) => (
  <HeroCard
    emoji="🗡️"
    subEmoji="🌑"
    label="محتال"
    selected={selected}
    bgStyle={{ background: 'linear-gradient(145deg, #1a0000 0%, #3d0000 60%, #1a0000 100%)' }}
    glowColor="#ef4444"
    className={className}
  />
);

/* ─── Animated idle hero (no hero selected) ────────────────────────────── */

export const AnimatedIdleHero = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-24 h-32 flex flex-col items-center justify-end ${className}`}>
    {/* Ground glow */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-primary/30 rounded-full blur-md" />

    {/* Outer rune ring */}
    <div
      className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full"
      style={{ border: '1px dashed rgba(240,192,64,0.25)', animation: 'idle-spin-cw 12s linear infinite' }}
    />
    {/* Inner rune ring */}
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full"
      style={{ border: '1px dotted rgba(139,0,0,0.35)', animation: 'idle-spin-ccw 7s linear infinite' }}
    />

    {/* Floating body */}
    <div className="relative" style={{ animation: 'idle-float 3s ease-in-out infinite' }}>
      {/* Cape */}
      <div
        className="absolute -left-3 top-6 z-0"
        style={{
          width: '4.5rem', height: '3.5rem',
          background: 'hsl(260,59%,23%,0.7)',
          clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
          animation: 'idle-cape 3s ease-in-out infinite',
          filter: 'drop-shadow(0 0 8px rgba(45,27,105,0.6))',
        }}
      />
      {/* Head */}
      <div
        className="relative z-10 w-10 h-10 rounded-full mx-auto flex items-center justify-center"
        style={{ background: 'hsl(260,59%,12%)', border: '1px solid hsl(260,59%,23%)', boxShadow: '0 0 18px rgba(45,27,105,0.9)' }}
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-secondary/80"
          style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="flex gap-2 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary"
            style={{ animation: 'idle-eye-pulse 2s ease-in-out infinite', boxShadow: '0 0 6px 2px rgba(139,0,0,0.8)' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary"
            style={{ animation: 'idle-eye-pulse 2s ease-in-out infinite 0.15s', boxShadow: '0 0 6px 2px rgba(139,0,0,0.8)' }} />
        </div>
      </div>
      {/* Torso */}
      <div className="relative z-10 w-12 mx-auto" style={{ height: '3rem', marginTop: '-1px' }}>
        <div className="w-full h-full bg-secondary"
          style={{ clipPath: 'polygon(15% 0%, 85% 0%, 95% 100%, 5% 100%)', boxShadow: '0 0 20px rgba(45,27,105,0.5)' }} />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-accent/70 rotate-45"
          style={{ animation: 'idle-emblem-glow 2s ease-in-out infinite', boxShadow: '0 0 8px 2px rgba(240,192,64,0.4)' }} />
      </div>
      {/* Sword */}
      <div className="absolute top-1 -right-5 z-20" style={{ transform: 'rotate(15deg)' }}>
        <div className="w-3 h-1.5 bg-accent/70 rounded-full mx-auto mb-0.5" />
        <div className="w-1 h-4 bg-[hsl(20,40%,30%)] mx-auto" />
        <div className="w-5 h-1 bg-accent mx-auto" style={{ boxShadow: '0 0 4px rgba(240,192,64,0.6)' }} />
        <div className="w-1.5 h-14 mx-auto rounded-b-full"
          style={{
            background: 'linear-gradient(to bottom, #fff 0%, #cbd5e1 40%, #475569 100%)',
            animation: 'idle-sword-glow 2s ease-in-out infinite',
            boxShadow: '0 0 10px 2px rgba(240,192,64,0.5)',
          }} />
      </div>
    </div>

    {/* Sparkles */}
    <div className="absolute top-2 left-1 w-1.5 h-1.5 bg-accent/80 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
    <div className="absolute top-8 right-1 w-1 h-1 bg-primary/80 rounded-full animate-ping" style={{ animationDuration: '1.7s', animationDelay: '0.4s' }} />
    <div className="absolute top-14 left-2 w-1 h-1 bg-accent/60 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
  </div>
);

/* ─── Unified HeroArt dispatcher ─────────────────────────────────────────── */

export const HeroArt = ({
  type,
  selected,
  className = '',
}: {
  type: string | null | undefined;
  selected?: boolean;
  className?: string;
}) => {
  switch (type) {
    case 'warrior':  return <WarriorArt  selected={selected} className={className} />;
    case 'mage':     return <MageArt     selected={selected} className={className} />;
    case 'assassin': return <AssassinArt selected={selected} className={className} />;
    default:         return <AnimatedIdleHero className={className} />;
  }
};
