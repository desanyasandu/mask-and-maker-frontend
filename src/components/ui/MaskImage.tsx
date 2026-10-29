import { useState, type ReactNode } from "react";
import type { Mask, Tradition } from "@/lib/types";
import { cn } from "@/utils/cn";

/* Deterministic pseudo-random from a seed (archive plate geometry). */
function mulberry(seed: number) {
  let a = seed + 0x6d2b79f5;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const plateAccent: Record<Tradition, string> = {
  raksha: "var(--vermilion)",
  sanni: "var(--forest)",
  kolam: "var(--gold)",
};

const plateWash: Record<Tradition, string> = {
  raksha: "var(--vermilion)",
  sanni: "var(--forest)",
  kolam: "var(--gold)",
};

/**
 * Archive plate — the art-directed placeholder. A unique gold line-drawing of
 * the mask, seeded per-piece to vary hood count, proportions and expression,
 * drawn like a museum registry plate on a tiered warm ground.
 */
export function ArchivePlate({
  seed,
  variant,
  tradition,
  label,
  className,
}: {
  seed: number;
  variant: number;
  tradition: Tradition;
  label?: string;
  className?: string;
}) {
  const rand = mulberry(seed);
  const cx = 100;
  const cy = 138;
  const faceRx = 44 + rand() * 6;
  const faceRy = 56 + rand() * 8;
  const accent = plateAccent[tradition];
  const wash = plateWash[tradition];
  const fierce = tradition !== "kolam";

  /* serpent-hood crown (variant 1): n kites fanned above the brow */
  const hoodCount = 5 + (seed % 4);
  const hoods: string[] = [];
  if (variant === 1) {
    for (let i = 0; i < hoodCount; i++) {
      const t = Math.PI - (i / (hoodCount - 1)) * Math.PI * (0.82 + rand() * 0.05) - Math.PI * 0.09;
      const baseR = faceRx * 1.05;
      const tipR = 102 + rand() * 16;
      const bx = cx + Math.cos(t) * baseR;
      const by = cy - 8 + Math.sin(t) * baseR * 1.18;
      const tx = cx + Math.cos(t) * tipR;
      const ty = cy - 8 + Math.sin(t) * tipR;
      const w = 9 + rand() * 3;
      const nx = Math.cos(t + Math.PI / 2) * w;
      const ny = Math.sin(t + Math.PI / 2) * w;
      hoods.push(`M ${bx + nx} ${by + ny} Q ${tx + nx * 1.7} ${ty + ny * 1.7} ${tx} ${ty} Q ${tx - nx * 1.7} ${ty - ny * 1.7} ${bx - nx} ${by - ny}`);
    }
  }

  /* flame crown (variant 2) */
  const flames: string[] = [];
  if (variant === 2) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const x = cx - faceRx - 8 + (i / (n - 1)) * (faceRx * 2 + 16);
      const h = 26 + rand() * 30;
      flames.push(`M ${x - 9} ${cy - faceRy + 8} Q ${x - 5} ${cy - faceRy - h * 0.55} ${x} ${cy - faceRy - h} Q ${x + 5} ${cy - faceRy - h * 0.55} ${x + 9} ${cy - faceRy + 8}`);
    }
  }

  /* mouth: fanged for raksha & sanni, wry for kolam */
  const teeth: string[] = [];
  if (fierce) {
    const mw = 36 + rand() * 8;
    const my = cy + faceRy * 0.52;
    const n = 5;
    for (let i = 0; i < n; i++) {
      const x = cx - mw / 2 + (i / (n - 1)) * mw;
      teeth.push(`M ${x - 4} ${my} L ${x} ${my + 9 + rand() * 4} L ${x + 4} ${my}`);
    }
  }

  const eyeY = cy - faceRy * 0.24;
  const eyeDx = faceRx * 0.42;
  const eyeR = fierce ? 9.5 + rand() * 1.5 : 7 + rand();

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 90% at 50% 18%, color-mix(in oklab, ${wash} 9%, var(--s3)), var(--s2) 55%, var(--s1))`,
      }}
    >
      {/* corner registration ticks */}
      <svg className="absolute inset-0 h-full w-full p-3 text-gold/30" viewBox="0 0 200 250" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true">
        <path d="M12 12 h10 M12 12 v10 M188 12 h-10 M188 12 v10 M12 238 h10 M12 238 v-10 M188 238 h-10 M188 238 v-10" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg viewBox="0 0 200 250" className="absolute inset-x-0 top-[6%] mx-auto h-[76%]" fill="none" aria-hidden="true">
        <g stroke="var(--gold)" strokeOpacity="0.75" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
          {variant === 0 && (
            <>
              <path d={`M ${cx - faceRx - 20} ${cy - faceRy * 0.62} Q ${cx} ${cy - faceRy - 34} ${cx + faceRx + 20} ${cy - faceRy * 0.62}`} />
              <path d={`M ${cx - faceRx - 12} ${cy - faceRy * 0.52} Q ${cx} ${cy - faceRy - 16} ${cx + faceRx + 12} ${cy - faceRy * 0.52}`} strokeOpacity="0.45" />
            </>
          )}
          {hoods.map((d, i) => (
            <path key={i} d={d} />
          ))}
          {flames.map((d, i) => (
            <path key={i} d={d} />
          ))}
          {/* face */}
          <ellipse cx={cx} cy={cy} rx={faceRx} ry={faceRy} />
          <ellipse cx={cx} cy={cy} rx={faceRx - 6} ry={faceRy - 7} strokeOpacity="0.35" />
          {/* brows */}
          {fierce ? (
            <>
              <path d={`M ${cx - eyeDx - 12} ${eyeY - 12} L ${cx - eyeDx + 10} ${eyeY - 18}`} stroke={accent} />
              <path d={`M ${cx + eyeDx + 12} ${eyeY - 12} L ${cx + eyeDx - 10} ${eyeY - 18}`} stroke={accent} />
            </>
          ) : (
            <>
              <path d={`M ${cx - eyeDx - 11} ${eyeY - 13} Q ${cx - eyeDx} ${eyeY - 18} ${cx - eyeDx + 11} ${eyeY - 13}`} stroke={accent} />
              <path d={`M ${cx + eyeDx - 11} ${eyeY - 13} Q ${cx + eyeDx} ${eyeY - 18} ${cx + eyeDx + 11} ${eyeY - 13}`} stroke={accent} />
            </>
          )}
          {/* eyes */}
          <circle cx={cx - eyeDx} cy={eyeY} r={eyeR} />
          <circle cx={cx + eyeDx} cy={eyeY} r={eyeR} />
          <circle cx={cx - eyeDx} cy={eyeY} r={2.6} fill={accent} stroke="none" fillOpacity="0.85" />
          <circle cx={cx + eyeDx} cy={eyeY} r={2.6} fill={accent} stroke="none" fillOpacity="0.85" />
          {/* nose */}
          <path d={`M ${cx} ${eyeY + 14} q 5 12 0 20 q -5 -8 0 -20`} strokeOpacity="0.55" />
          {/* mouth */}
          {fierce ? (
            <>
              <path d={`M ${cx - 22} ${cy + faceRy * 0.5} Q ${cx} ${cy + faceRy * 0.62} ${cx + 22} ${cy + faceRy * 0.5}`} stroke={accent} />
              <path d={`M ${cx - 22} ${cy + faceRy * 0.66} Q ${cx} ${cy + faceRy * 0.8} ${cx + 22} ${cy + faceRy * 0.66}`} stroke={accent} strokeOpacity="0.7" />
              {teeth.map((d, i) => (
                <path key={i} d={d} strokeOpacity="0.6" />
              ))}
            </>
          ) : (
            <path d={`M ${cx - 16} ${cy + faceRy * 0.5} Q ${cx} ${cy + faceRy * (0.58 + rand() * 0.1)} ${cx + 16} ${cy + faceRy * 0.5}`} stroke={accent} />
          )}
          {/* ear flares */}
          <path d={`M ${cx - faceRx} ${cy} q -12 6 -10 22`} strokeOpacity="0.5" />
          <path d={`M ${cx + faceRx} ${cy} q 12 6 10 22`} strokeOpacity="0.5" />
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-between p-3">
        <span className="font-mono text-[10px] tracking-wide text-ink4 tnum">№ {String(seed * 137 + 109).padStart(5, "0")}</span>
        {label && <span className="text-[10px] uppercase tracking-[0.16em] text-ink4">{label}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------ ImageFrame ---
   Consistent-ratio image with blur-up, inner ring and graceful fallback. */

export function ImageFrame({
  src,
  alt,
  ratio = "aspect-[4/5]",
  className,
  eager,
  fallback,
}: {
  src?: string;
  alt: string;
  ratio?: string;
  className?: string;
  eager?: boolean;
  fallback?: ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const showFallback = !src || err;

  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-s2 ring-1 ring-inset ring-white/[0.05]", ratio, className)}>
      {showFallback ? (
        fallback ?? null
      ) : (
        <>
          <img
            src={src}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setErr(true)}
            className={cn(
              "h-full w-full object-cover transition-all duration-700 ease-out",
              loaded ? "scale-100 opacity-100 blur-0" : "scale-[1.04] opacity-0 blur-md"
            )}
          />
          {!loaded && <div className="skel absolute inset-0" aria-hidden="true" />}
        </>
      )}
    </div>
  );
}

/** Convenience: a mask's studio photograph, or its archival plate. */
export function MaskArtwork({ mask, ratio, className, eager }: { mask: Mask; ratio?: string; className?: string; eager?: boolean }) {
  return (
    <ImageFrame
      src={mask.image}
      alt={`${mask.name} — hand-carved ${mask.tradition} mask from ${mask.region}`}
      ratio={ratio}
      className={className}
      eager={eager}
      fallback={<ArchivePlate seed={mask.plateSeed} variant={mask.plateVariant} tradition={mask.tradition} label={mask.name} />}
    />
  );
}
