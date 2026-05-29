import React from 'react';

export const WarriorArt = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-24 h-24 flex items-center justify-center ${className}`}>
    <div className="absolute w-16 h-20 bg-secondary border-2 border-slate-500 rounded-b-full shadow-[0_0_15px_rgba(45,27,105,0.8)] z-10" />
    <div className="absolute w-2 h-24 bg-slate-300 z-0 transform rotate-45" />
    <div className="absolute w-6 h-1 bg-accent z-0 transform rotate-45" />
    <div className="absolute w-2 h-16 bg-slate-400 rounded-b-full z-20 left-1/2 -translate-x-1/2 top-2 opacity-50" />
  </div>
);

export const MageArt = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-24 h-24 flex items-center justify-center ${className}`}>
    <div className="absolute w-2 h-24 bg-[hsl(20,40%,30%)] z-0 transform -rotate-12" />
    <div className="absolute w-12 h-12 bg-primary rounded-full z-10 shadow-[0_0_20px_hsl(0,100%,40%)] flex items-center justify-center top-2 -right-1">
      <div className="w-6 h-6 bg-accent rounded-full animate-pulse" />
    </div>
    <div className="absolute w-1 h-1 bg-white rounded-full top-0 right-4 animate-ping" />
    <div className="absolute w-2 h-2 bg-accent rounded-full top-4 right-10 animate-ping" style={{ animationDelay: '0.2s' }} />
  </div>
);

export const AssassinArt = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-24 h-24 flex items-center justify-center ${className}`}>
    <div className="absolute w-1.5 h-20 bg-slate-600 z-10 transform rotate-[30deg] -translate-x-4 shadow-[0_0_10px_rgba(0,0,0,0.8)]" />
    <div className="absolute w-1.5 h-20 bg-slate-600 z-10 transform -rotate-[30deg] translate-x-4 shadow-[0_0_10px_rgba(0,0,0,0.8)]" />
    <div className="absolute w-16 h-16 bg-black rounded-full z-0 blur-md opacity-80" />
    <div className="absolute w-12 h-12 bg-card border border-secondary rounded-full z-20 flex items-center justify-center">
      <div className="flex gap-2 mb-2">
        <div className="w-2 h-1 bg-primary rounded-full shadow-[0_0_5px_hsl(var(--primary))]" />
        <div className="w-2 h-1 bg-primary rounded-full shadow-[0_0_5px_hsl(var(--primary))]" />
      </div>
    </div>
  </div>
);

export const AnimatedIdleHero = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-24 h-32 flex flex-col items-center justify-end ${className}`}>
    {/* Ground glow */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-primary/30 rounded-full blur-md" />

    {/* Outer rune ring — slow clockwise */}
    <div
      className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full"
      style={{
        border: '1px dashed rgba(240,192,64,0.25)',
        animation: 'idle-spin-cw 12s linear infinite',
      }}
    />
    {/* Inner rune ring — counter-clockwise */}
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full"
      style={{
        border: '1px dotted rgba(139,0,0,0.35)',
        animation: 'idle-spin-ccw 7s linear infinite',
      }}
    />

    {/* Floating body */}
    <div
      className="relative"
      style={{ animation: 'idle-float 3s ease-in-out infinite' }}
    >
      {/* Cape behind body */}
      <div
        className="absolute -left-3 top-6 w-18 h-14 bg-secondary/70 z-0"
        style={{
          width: '4.5rem',
          clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
          animation: 'idle-cape 3s ease-in-out infinite',
          filter: 'drop-shadow(0 0 8px rgba(45,27,105,0.6))',
        }}
      />

      {/* Head / hood */}
      <div
        className="relative z-10 w-10 h-10 rounded-full mx-auto flex items-center justify-center"
        style={{
          background: 'hsl(260,59%,12%)',
          border: '1px solid hsl(260,59%,23%)',
          boxShadow: '0 0 18px rgba(45,27,105,0.9)',
        }}
      >
        {/* Hood peak */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-secondary/80"
          style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
        />
        {/* Eyes */}
        <div className="flex gap-2 mt-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            style={{ animation: 'idle-eye-pulse 2s ease-in-out infinite', boxShadow: '0 0 6px 2px rgba(139,0,0,0.8)' }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            style={{ animation: 'idle-eye-pulse 2s ease-in-out infinite 0.15s', boxShadow: '0 0 6px 2px rgba(139,0,0,0.8)' }}
          />
        </div>
      </div>

      {/* Torso / robe */}
      <div
        className="relative z-10 w-12 mx-auto"
        style={{ height: '3rem', marginTop: '-1px' }}
      >
        <div
          className="w-full h-full bg-secondary"
          style={{
            clipPath: 'polygon(15% 0%, 85% 0%, 95% 100%, 5% 100%)',
            boxShadow: '0 0 20px rgba(45,27,105,0.5)',
            border: '1px solid rgba(45,27,105,0.4)',
          }}
        />
        {/* Chest diamond emblem */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-accent/70 rotate-45"
          style={{
            animation: 'idle-emblem-glow 2s ease-in-out infinite',
            boxShadow: '0 0 8px 2px rgba(240,192,64,0.4)',
          }}
        />
      </div>

      {/* Sword (positioned to the right) */}
      <div className="absolute top-1 -right-5 z-20" style={{ transform: 'rotate(15deg)' }}>
        {/* Pommel */}
        <div className="w-3 h-1.5 bg-accent/70 rounded-full mx-auto mb-0.5" />
        {/* Grip */}
        <div className="w-1 h-4 bg-[hsl(20,40%,30%)] mx-auto" />
        {/* Guard */}
        <div className="w-5 h-1 bg-accent mx-auto" style={{ boxShadow: '0 0 4px rgba(240,192,64,0.6)' }} />
        {/* Blade */}
        <div
          className="w-1.5 h-14 mx-auto rounded-b-full"
          style={{
            background: 'linear-gradient(to bottom, #fff 0%, #cbd5e1 40%, #475569 100%)',
            animation: 'idle-sword-glow 2s ease-in-out infinite',
            boxShadow: '0 0 10px 2px rgba(240,192,64,0.5)',
          }}
        />
      </div>
    </div>

    {/* Floating sparkles */}
    <div className="absolute top-2 left-1 w-1.5 h-1.5 bg-accent/80 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
    <div className="absolute top-8 right-1 w-1 h-1 bg-primary/80 rounded-full animate-ping" style={{ animationDuration: '1.7s', animationDelay: '0.4s' }} />
    <div className="absolute top-14 left-2 w-1 h-1 bg-accent/60 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
  </div>
);

export const HeroArt = ({ type, className = '' }: { type: string | null | undefined, className?: string }) => {
  switch (type) {
    case 'warrior':  return <WarriorArt className={className} />;
    case 'mage':     return <MageArt className={className} />;
    case 'assassin': return <AssassinArt className={className} />;
    default:         return <AnimatedIdleHero className={className} />;
  }
};
