import React from 'react';

export const WarriorArt = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-24 h-24 flex items-center justify-center ${className}`}>
    {/* Shield Base */}
    <div className="absolute w-16 h-20 bg-secondary border-2 border-slate-500 rounded-b-full shadow-[0_0_15px_rgba(45,27,105,0.8)] z-10" />
    {/* Sword */}
    <div className="absolute w-2 h-24 bg-slate-300 z-0 transform rotate-45" />
    <div className="absolute w-6 h-1 bg-accent z-0 transform rotate-45" />
    {/* Highlight */}
    <div className="absolute w-2 h-16 bg-slate-400 rounded-b-full z-20 left-1/2 -translate-x-1/2 top-2 opacity-50" />
  </div>
);

export const MageArt = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-24 h-24 flex items-center justify-center ${className}`}>
    {/* Staff */}
    <div className="absolute w-2 h-24 bg-[hsl(20,40%,30%)] z-0 transform -rotate-12" />
    {/* Orb */}
    <div className="absolute w-12 h-12 bg-primary rounded-full z-10 shadow-[0_0_20px_hsl(0,100%,40%)] flex items-center justify-center top-2 -right-1">
      <div className="w-6 h-6 bg-accent rounded-full animate-pulse" />
    </div>
    {/* Sparkles */}
    <div className="absolute w-1 h-1 bg-white rounded-full top-0 right-4 animate-ping" />
    <div className="absolute w-2 h-2 bg-accent rounded-full top-4 right-10 animate-ping" style={{ animationDelay: '0.2s' }} />
  </div>
);

export const AssassinArt = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-24 h-24 flex items-center justify-center ${className}`}>
    {/* Dagger 1 */}
    <div className="absolute w-1.5 h-20 bg-slate-600 z-10 transform rotate-[30deg] -translate-x-4 shadow-[0_0_10px_rgba(0,0,0,0.8)]" />
    <div className="absolute w-1.5 h-20 bg-slate-600 z-10 transform -rotate-[30deg] translate-x-4 shadow-[0_0_10px_rgba(0,0,0,0.8)]" />
    {/* Cowl / Dark Aura */}
    <div className="absolute w-16 h-16 bg-black rounded-full z-0 blur-md opacity-80" />
    <div className="absolute w-12 h-12 bg-card border border-secondary rounded-full z-20 flex items-center justify-center">
      {/* Eyes */}
      <div className="flex gap-2 mb-2">
        <div className="w-2 h-1 bg-primary rounded-full shadow-[0_0_5px_hsl(var(--primary))]" />
        <div className="w-2 h-1 bg-primary rounded-full shadow-[0_0_5px_hsl(var(--primary))]" />
      </div>
    </div>
  </div>
);

export const HeroArt = ({ type, className = '' }: { type: string | null | undefined, className?: string }) => {
  switch (type) {
    case 'warrior': return <WarriorArt className={className} />;
    case 'mage': return <MageArt className={className} />;
    case 'assassin': return <AssassinArt className={className} />;
    default: return <div className={`w-24 h-24 bg-card border border-dashed border-muted flex items-center justify-center rounded-lg text-muted-foreground text-xs ${className}`}>No Hero</div>;
  }
};
