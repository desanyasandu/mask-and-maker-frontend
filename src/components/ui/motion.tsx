import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { EXPO, staggerParent, fadeUpChild } from "@/lib/utils";

/* Staggered entry: opacity 0→1, translateY(6px→0), 180ms, 40ms stagger */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={fadeUpChild}>
      {children}
    </motion.div>
  );
}

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.18, ease: EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

interface NumberTickerProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

/** requestAnimationFrame count-up with tabular-nums; re-animates when `value` changes. */
export function NumberTicker({ value, duration = 1100, format, className }: NumberTickerProps) {
  const fmt = format ?? ((n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n)));
  const [display, setDisplay] = useState(() => fmt(0));
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const fromRef = useRef(0);
  const rafRef = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (reduce) {
      setDisplay(fmt(value));
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    const t0 = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(fmt(from + (value - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, started, duration, fmt, reduce]);

  return (
    <span ref={ref} className={cn("font-mono tnum", className)}>
      {display}
    </span>
  );
}
