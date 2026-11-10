import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useRef, type CSSProperties } from "react";
import { EXPO } from "@/lib/utils";

/** Pulled at least this far, the cord counts as a tug and flips the lamp. */
const PULL = 22;

const fireflies = [
  { x: 9, y: 16, s: 3, d: 11, dl: 0 },
  { x: 24, y: 62, s: 2, d: 9, dl: -3 },
  { x: 17, y: 38, s: 3, d: 13, dl: -6 },
  { x: 38, y: 82, s: 2, d: 10, dl: -2 },
  { x: 62, y: 14, s: 2, d: 12, dl: -5 },
  { x: 74, y: 58, s: 3, d: 9, dl: -1 },
  { x: 86, y: 30, s: 2, d: 14, dl: -8 },
  { x: 91, y: 76, s: 3, d: 11, dl: -4 },
  { x: 51, y: 8, s: 2, d: 10, dl: -7 },
  { x: 6, y: 86, s: 2, d: 12, dl: -9 },
  { x: 80, y: 90, s: 2, d: 13, dl: -3 },
  { x: 32, y: 24, s: 2, d: 15, dl: -10 },
];

type Props = {
  on: boolean;
  onToggle: () => void;
  className?: string;
  children?: React.ReactNode;
};

/**
 * A standing lamp with a pull cord. The page's sign-in form lives in the light it throws:
 * tug the cord (or press it) and the room darkens and the form goes with it.
 */
export function LampScene({ on, onToggle, className = "", children }: Props) {
  const reduce = useReducedMotion();
  const pull = useMotionValue(0);
  const cord = useTransform(pull, (v) => `calc(var(--h) * 0.2 + ${v}px)`);
  const dragged = useRef(false);

  const light = on
    ? { opacity: reduce ? 1 : [0, 0.85, 0.3, 1], transition: { duration: reduce ? 0 : 0.7, times: [0, 0.2, 0.4, 1], ease: "linear" as const } }
    : { opacity: 0, transition: { duration: reduce ? 0 : 0.4, ease: EXPO } };

  return (
    <section className={`relative isolate flex flex-col overflow-hidden bg-[#0a0907] ${className}`} aria-label="Lamp">
      {/* the glow the lamp throws across the whole room, and the fireflies caught in it */}
      <motion.div initial={false} animate={light} className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_52%,rgba(221,185,131,0.2),transparent_70%)]" />
        {fireflies.map((f, i) => (
          <span
            key={i}
            className="firefly absolute rounded-full bg-[#f1d9a6] shadow-[0_0_8px_2px_rgba(221,185,131,0.7)]"
            style={{ left: `${f.x}%`, top: `${f.y}%`, width: f.s, height: f.s, "--d": `${f.d}s`, "--dl": `${f.dl}s` } as CSSProperties}
          />
        ))}
      </motion.div>

      <div className="grid flex-1 place-items-center py-6 sm:py-8 lg:pt-16 lg:pb-4">
        <div className="relative [--h:196px] sm:[--h:240px] lg:[--h:380px]" style={{ height: "var(--h)", width: "calc(var(--h) * 0.65)" }}>
          {/* the cone of light and the pool it lands in */}
          <motion.div initial={false} animate={light} className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
              className="absolute top-[31%] left-1/2 h-[69%] w-[170%] -translate-x-1/2 bg-gradient-to-b from-[rgba(221,185,131,0.5)] via-[rgba(221,185,131,0.14)] to-[rgba(221,185,131,0.03)]"
              style={{ clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)" }}
            />
            <div className="absolute bottom-[1%] left-1/2 h-[6%] w-[120%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(221,185,131,0.35),transparent)]" />
            <div className="absolute top-[28.6%] left-1/2 h-[1.6%] w-[44%] -translate-x-1/2 rounded-full bg-[#fff1d0] shadow-[0_0_18px_6px_rgba(221,185,131,0.85)]" />
          </motion.div>

          <svg viewBox="0 0 260 400" className="relative size-full" aria-hidden="true">
            <path d="M52 122C52 78 88 52 130 52s78 26 78 70Z" fill="#17130f" stroke="rgba(255,255,255,0.09)" strokeWidth="1.2" />
            <path d="M70 92c10-18 32-28 60-28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeLinecap="round" />
            <rect x="127.5" y="122" width="5" height="238" rx="2.5" fill="#2a231b" />
            <ellipse cx="130" cy="366" rx="48" ry="8" fill="#17130f" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          </svg>

          {/* the cord: pull it, tap it, or press Enter on it */}
          <div className="absolute top-[30.5%] left-[75%] w-0">
            <motion.span style={{ height: cord }} className="absolute top-0 left-0 block w-px -translate-x-1/2 bg-gold/70" aria-hidden="true" />
            <motion.button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label="Lamp"
              title={on ? "Pull to turn the lamp off" : "Pull to turn the lamp on"}
              style={{ y: pull, top: "calc(var(--h) * 0.2)" }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.45 }}
              dragSnapToOrigin
              onDragStart={() => {
                dragged.current = true;
              }}
              onDragEnd={(_, info) => {
                if (info.offset.y > PULL) onToggle();
                setTimeout(() => (dragged.current = false), 0);
              }}
              onClick={() => {
                if (dragged.current) return;
                onToggle();
                if (!reduce) animate(pull, [0, 16, 0], { duration: 0.35, ease: EXPO });
              }}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              className="group/knob absolute left-0 grid size-9 -translate-x-1/2 cursor-grab touch-none place-items-center rounded-full active:cursor-grabbing"
            >
              <span className="h-[18px] w-2.5 rounded-full bg-gradient-to-b from-gold-strong to-gold shadow-[0_0_10px_rgba(221,185,131,0.55)] transition-shadow group-hover/knob:shadow-[0_0_16px_rgba(221,185,131,0.9)]" />
              {!on && <span className="absolute size-9 animate-ping rounded-full border border-gold/50 motion-reduce:hidden" aria-hidden="true" />}
            </motion.button>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}
