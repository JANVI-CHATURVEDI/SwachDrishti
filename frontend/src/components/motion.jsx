import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, useMotionValue, useSpring, animate } from 'framer-motion';

export const EASE = [0.16, 1, 0.3, 1];

/** Shared variants for staggered groups. */
export const staggerContainer = (delayChildren = 0, staggerChildren = 0.08) => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
});

export const fadeUp = (y = 16, duration = 0.6) => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: { duration, ease: EASE } },
});

/**
 * Fade + translate on scroll into view. Runs once by default.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 16,
  duration = 0.6,
  once = true,
  as = 'div',
  ...rest
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      className={className}
      initial={reduced ? undefined : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once, margin: '0px 0px -60px 0px' }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/** Container that staggers direct Reveal-style children. */
export function RevealGroup({ children, className = '', delay = 0, stagger = 0.08, y = 16, ...rest }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? undefined : 'hidden'}
      whileInView={reduced ? undefined : 'show'}
      variants={reduced ? undefined : staggerContainer(delay, stagger)}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      {...rest}
    >
      {React.Children.map(children, (child, i) =>
        React.isValidElement(child) ? (
          <motion.div key={child.key ?? i} variants={reduced ? undefined : fadeUp(y, 0.55)}>
            {child}
          </motion.div>
        ) : (
          child
        )
      )}
    </motion.div>
  );
}

function formatNumber(n, decimals) {
  const fixed = Number(n).toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec ? `${withSep}.${dec}` : withSep;
}

/**
 * Animates a numeric value up to `target` once it scrolls into view.
 */
export function CountUp({
  value = 0,
  duration = 1.4,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  delay = 0,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px 0px' });
  const reduced = useReducedMotion();
  const target = Number(value);
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [display, setDisplay] = useState(reduced ? safeTarget : 0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (reduced) {
      setDisplay(safeTarget);
      return;
    }
    if (!inView) return;
    const controls = animate(fromRef.current, safeTarget, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
      onComplete: () => { fromRef.current = safeTarget; },
    });
    return () => controls.stop();
  }, [inView, safeTarget, reduced, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(display, decimals)}
      {suffix}
    </span>
  );
}

/**
 * Infinite horizontal marquee. Pauses on hover and stops entirely when the
 * user prefers reduced motion.
 */
export function Marquee({ children, speed = 38, className = '', pauseOnHover = true }) {
  const reduced = useReducedMotion();
  const items = React.Children.toArray(children);
  if (reduced) {
    return <div className={`flex flex-wrap gap-3 ${className}`}>{items}</div>;
  }
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className={`flex w-max items-center gap-10 ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
        style={{ animation: `marquee ${speed}s linear infinite` }}
      >
        <div className="flex shrink-0 items-center gap-10">{items}</div>
        <div className="flex shrink-0 items-center gap-10" aria-hidden="true">{items}</div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent to-transparent" />
    </div>
  );
}

/**
 * Cursor-following radial highlight card. Writes `--mx` / `--my` for the
 * `.spotlight` CSS in index.css.
 */
export function SpotlightCard({ children, className = '', maxGlow = 1, ...rest }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    el.style.setProperty('--glow', String(maxGlow));
  };
  return (
    <div ref={ref} onMouseMove={onMove} className={`spotlight ${className}`} {...rest}>
      {children}
    </div>
  );
}

/**
 * Subtle 3D tilt that follows the cursor (disabled for reduced motion).
 */
export function Tilt({ children, className = '', max = 7, ...rest }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });

  const onMove = (e) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max);
    rx.set(-py * max);
  };
  const reset = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={reduced ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Fade + slide page transition for route content (250ms). */
export function PageTransition({ children, className = '', ...rest }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** A small always-on pulse dot used for "live" indicators. */
export function LiveDot({ className = '', color = 'bg-leaf-500' }) {
  return (
    <span className={`relative inline-flex h-2 w-2 ${className}`}>
      <span className={`absolute inset-0 rounded-full ${color} animate-ping opacity-75`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}
