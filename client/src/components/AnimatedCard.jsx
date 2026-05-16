import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

// Animated counting number
export function CountUp({ target, duration = 1.5 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count.toLocaleString()}</span>;
}

// ── Enhanced Animated Card with 3D tilt + glow ────────────
export function AnimatedCard({ children, delay = 0, className = '', style = {}, onClick, glowColor = 'rgba(99,102,241,0.15)' }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({});

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -6;
    const rotateY = ((x - cx) / cx) * 6;
    setTilt({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`,
      transition: 'none',
    });
  };

  const handleMouseLeave = () => {
    setTilt({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
      transition: 'transform 0.4s ease',
    });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
      style={{
        ...style,
        ...tilt,
        cursor: onClick ? 'pointer' : 'default',
        transformStyle: 'preserve-3d',
      }}>
      {/* Glow overlay on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
          background: `radial-gradient(circle at 50% 0%, ${glowColor}, transparent 70%)`,
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

// ── Pulse Skeleton ─────────────────────────────────────────
export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-2xl p-5 border border-white/10 overflow-hidden relative"
      style={{ background: 'rgba(255,255,255,0.04)' }}>
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        }} />
      <div className="h-4 w-24 rounded-lg mb-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-8 w-16 rounded-lg mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-3 w-32 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </motion.div>
  );
}

// ── Glow Button ────────────────────────────────────────────
export function GlowButton({ children, onClick, className = '', variant = 'primary' }) {
  const base = variant === 'primary'
    ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'
    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20';
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${base} ${className}`}>
      {children}
    </motion.button>
  );
}

// ── Stat Card with animated border glow ───────────────────
export function StatCard({ icon, label, value, color = '#6366f1', delay = 0, sub, onClick }) {
  return (
    <AnimatedCard delay={delay} onClick={onClick} glowColor={`${color}25`}
      className="relative overflow-hidden rounded-2xl p-5 cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${color}12, ${color}06)`,
        border: `1px solid ${color}25`,
      }}>
      {/* Bottom accent */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: 0.6,
      }} />
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          {icon}
        </div>
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
          className="w-2 h-2 rounded-full" style={{ background: color }} />
      </div>
      <p className="text-2xl font-extrabold text-white">
        {typeof value === 'number' ? <CountUp target={value} /> : value}
      </p>
      <p className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </AnimatedCard>
  );
}
