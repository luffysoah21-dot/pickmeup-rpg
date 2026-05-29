import React from 'react';

export const SlimeArt = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-24 h-24 flex items-end justify-center pb-2 ${className}`}>
    <div className="w-16 h-12 bg-[hsl(160,80%,40%)] rounded-t-full rounded-b-lg shadow-[0_0_15px_hsl(160,80%,40%,0.5)] flex flex-col items-center justify-end pb-3 gap-1">
      <div className="flex gap-3">
        <div className="w-2 h-2 bg-black rounded-full" />
        <div className="w-2 h-2 bg-black rounded-full" />
      </div>
    </div>
  </div>
);

export const GoblinArt = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-24 h-24 flex items-center justify-center ${className}`}>
    {/* Body */}
    <div className="w-14 h-16 bg-[hsl(120,60%,35%)] rounded-xl relative z-10 flex flex-col items-center pt-3">
      {/* Eyes */}
      <div className="flex gap-2">
        <div className="w-3 h-2 bg-accent rounded-full rotate-12" />
        <div className="w-3 h-2 bg-accent rounded-full -rotate-12" />
      </div>
      {/* Mouth */}
      <div className="w-6 h-1.5 bg-black mt-2 rounded-sm" />
    </div>
    {/* Ears */}
    <div className="absolute w-6 h-2 bg-[hsl(120,60%,35%)] top-8 -left-4 -rotate-[20deg] rounded-l-full" />
    <div className="absolute w-6 h-2 bg-[hsl(120,60%,35%)] top-8 -right-4 rotate-[20deg] rounded-r-full" />
    {/* Dagger */}
    <div className="absolute w-2 h-12 bg-slate-400 bottom-0 -left-2 rotate-45 z-20" />
  </div>
);

export const OrcArt = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-32 h-32 flex items-center justify-center ${className}`}>
    {/* Bulk Body */}
    <div className="w-20 h-24 bg-[hsl(140,40%,30%)] rounded-t-3xl rounded-b-md relative z-10 flex flex-col items-center pt-4 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
      {/* Eyes */}
      <div className="flex gap-3">
        <div className="w-2 h-2 bg-primary rounded-full" />
        <div className="w-2 h-2 bg-primary rounded-full" />
      </div>
      {/* Tusks */}
      <div className="flex gap-4 mt-4">
        <div className="w-1.5 h-3 bg-white rounded-t-sm" />
        <div className="w-1.5 h-3 bg-white rounded-t-sm" />
      </div>
    </div>
    {/* Axe */}
    <div className="absolute w-4 h-24 bg-[hsl(20,40%,20%)] right-2 bottom-0 z-0 rotate-12 flex justify-center">
      <div className="w-12 h-10 bg-slate-500 rounded-r-full absolute top-2 right-0" />
    </div>
  </div>
);

export const DragonArt = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-40 h-40 flex items-center justify-center ${className}`}>
    {/* Wings */}
    <div className="absolute w-24 h-16 bg-primary opacity-80 right-2 top-4 -rotate-12 rounded-tr-full rounded-bl-full z-0" />
    <div className="absolute w-24 h-16 bg-primary opacity-80 left-2 top-4 rotate-12 rounded-tl-full rounded-br-full z-0" />
    {/* Body */}
    <div className="w-16 h-20 bg-[hsl(0,80%,30%)] rounded-t-full relative z-10 flex flex-col items-center pt-4 border-2 border-black">
      {/* Eyes */}
      <div className="flex gap-4 w-full px-2 justify-center">
        <div className="w-3 h-1 bg-accent rotate-12 shadow-[0_0_5px_hsl(var(--accent))]" />
        <div className="w-3 h-1 bg-accent -rotate-12 shadow-[0_0_5px_hsl(var(--accent))]" />
      </div>
      {/* Snout */}
      <div className="w-10 h-8 bg-[hsl(0,80%,20%)] mt-4 rounded-b-xl" />
    </div>
    {/* Flame particle */}
    <div className="absolute w-4 h-4 bg-accent rounded-full bottom-4 animate-ping opacity-50 z-20" />
  </div>
);

export const DemonLordArt = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-48 h-48 flex items-center justify-center ${className}`}>
    {/* Dark Aura */}
    <div className="absolute inset-0 bg-secondary blur-2xl opacity-40 rounded-full animate-pulse" />
    {/* Crown */}
    <div className="absolute w-12 h-6 top-8 z-20 flex justify-between">
      <div className="w-2 h-6 bg-accent rotate-12" />
      <div className="w-2 h-8 bg-accent" />
      <div className="w-2 h-6 bg-accent -rotate-12" />
    </div>
    {/* Body Void */}
    <div className="w-24 h-32 bg-black rounded-t-full relative z-10 flex flex-col items-center pt-10 border border-primary shadow-[0_0_30px_hsl(var(--primary))]">
       {/* 3 Eyes */}
       <div className="w-full flex justify-center gap-2 mb-2">
         <div className="w-4 h-1.5 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]" />
         <div className="w-4 h-1.5 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]" />
       </div>
       <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_hsl(var(--primary))]" />
    </div>
  </div>
);

export const MonsterArt = ({ name, className = '' }: { name: string, className?: string }) => {
  switch (name.toLowerCase()) {
    case 'slime': return <SlimeArt className={className} />;
    case 'goblin': return <GoblinArt className={className} />;
    case 'orc': return <OrcArt className={className} />;
    case 'dragon': return <DragonArt className={className} />;
    case 'demon lord': return <DemonLordArt className={className} />;
    default: return <div className={`w-24 h-24 bg-card flex items-center justify-center rounded-lg text-xs ${className}`}>Monster</div>;
  }
};
