import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const PageTransition = ({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`min-h-[100dvh] w-full max-w-[375px] mx-auto bg-background text-foreground relative flex flex-col ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
};

// Generate stable particle positions once per mount to avoid Math.random() in render
const PARTICLE_COUNT = 20;

export const Particles = () => {
  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: `${(i * 5.3 + 2) % 100}%`,
      animationDelay: `${(i * 0.27) % 5}s`,
      animationDuration: `${3 + (i * 0.37) % 4}s`,
    })),
    []
  );

  return (
    <div className="particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
          }}
        />
      ))}
    </div>
  );
};
