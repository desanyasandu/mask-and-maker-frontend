import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useRef, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { EXPO } from "@/lib/utils";

/* ------------------------------------------------ SpotlightCard ---
   Mouse-tracking radial illumination + border reveal via --mx/--my. */

export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn("group/spot relative overflow-hidden rounded-lg bg-s2 transition-colors duration-180 hover:bg-s3", className)}
      style={{ "--mx": "50%", "--my": "50%" } as CSSProperties}
    >
      <div className="edge absolute inset-0 rounded-[inherit]" aria-hidden="true" />
      {/* border reveal */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0 transition-opacity duration-320 group-hover/spot:opacity-100"
        style={{
          background: "radial-gradient(520px circle at var(--mx) var(--my), color-mix(in oklab, var(--gold) 30%, transparent), transparent 44%)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {/* interior illumination */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-320 group-hover/spot:opacity-100"
        style={{ background: "radial-gradient(560px circle at var(--mx) var(--my), color-mix(in oklab, var(--gold) 6%, transparent), transparent 46%)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ------------------------------------------------ BorderBeam ---
   A traveling 1px light beam. Reserve for the single highest-priority
   element on a screen. */

export function BorderBeam({ duration = 6 }: { duration?: number }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="mm-beam" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--gold)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--gold)" />
          <stop offset="1" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect
        x="0.5"
        y="0.5"
        width="calc(100% - 1px)"
        height="calc(100% - 1px)"
        rx="8"
        fill="none"
        stroke="url(#mm-beam)"
        strokeWidth="1.4"
        pathLength={100}
        strokeDasharray="14 86"
        className="beam-rect"
        style={{ animationDuration: `${duration}s`, vectorEffect: "non-scaling-stroke" } as CSSProperties}
      />
    </svg>
  );
}

/* ------------------------------------------------ VerifiedSeal ---
   Gold seal with a one-time shimmer on reveal. */

export function VerifiedSeal({ size = "md", label = "Verified authentic" }: { size?: "sm" | "md" | "lg"; label?: string | null; }) {
  const dim = size === "lg" ? 88 : size === "sm" ? 44 : 64;
  const icon = size === "lg" ? "size-8" : size === "sm" ? "size-4" : "size-6";
  return (
    <figure className="inline-flex flex-col items-center gap-2">
      <span
        className="relative grid place-items-center rounded-full border border-gold/60 bg-gradient-to-b from-s2 to-s1"
        style={{ width: dim, height: dim }}
      >
        <span className="absolute inset-[5px] rounded-full border border-dashed border-gold/35" aria-hidden="true" />
        <ShieldCheck className={cn(icon, "text-gold")} aria-hidden="true" />
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden="true">
          <span className="absolute inset-y-0 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </span>
      </span>
      {label !== null && (
        <figcaption className="text-[11px] font-medium uppercase tracking-[0.14em] text-gold">{label}</figcaption>
      )}
    </figure>
  );
}

/* ------------------------------------------------ AnimatedTabs --- */

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export function AnimatedTabs({
  tabs,
  value,
  onChange,
  id,
  className,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  id: string;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-line bg-s1 p-1", className)} role="tablist">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative h-8 shrink-0 rounded-md px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-180",
              active ? "text-ink" : "text-ink3 hover:text-ink2"
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-${id}`}
                className="edge absolute inset-0 rounded-md bg-s3"
                transition={{ duration: 0.32, ease: EXPO }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">{t.icon}{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
