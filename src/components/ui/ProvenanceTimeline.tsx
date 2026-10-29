import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { EXPO } from "@/lib/utils";

export interface ProvStep {
  label: string;
  date?: string;
  actor?: string;
  state: "done" | "current" | "pending";
}

export function ProvenanceTimeline({ steps, className }: { steps: ProvStep[]; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <ol className={cn("relative", className)}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={`${s.label}-${i}`} className={cn("relative grid grid-cols-[22px_1fr] gap-3.5", !last && "pb-6")}>
            {!last && <span className="absolute top-6 bottom-0 left-[10px] w-px bg-line" aria-hidden="true" />}
            {!last && s.state === "done" && (
              <motion.span
                className="absolute top-6 bottom-0 left-[10px] w-px origin-top bg-gradient-to-b from-gold/70 to-gold/15"
                aria-hidden="true"
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.6, ease: EXPO, delay: i * 0.08 }}
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-0.5 grid size-[21px] place-items-center rounded-full border",
                s.state === "done" && "border-gold/70 bg-gold/15 text-gold",
                s.state === "current" && "border-gold bg-canvas text-gold",
                s.state === "pending" && "border-line bg-s2 text-ink4"
              )}
            >
              {s.state === "done" ? (
                <Check className="size-3" strokeWidth={2.5} />
              ) : (
                <span className={cn("size-1.5 rounded-full", s.state === "current" ? "bg-gold" : "bg-ink4")}>
                  {s.state === "current" ? (
                    <motion.span
                      className="block size-1.5 rounded-full bg-gold"
                      animate={reduce ? undefined : { scale: [1, 1.9, 1], opacity: [1, 0.25, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ) : null}
                </span>
              )}
            </span>
            <div className="min-w-0 pb-0.5">
              <p className={cn("text-sm font-medium", s.state === "pending" ? "text-ink3" : "text-ink")}>{s.label}</p>
              {(s.date || s.actor) && (
                <p className="mt-0.5 text-xs leading-relaxed text-ink3">
                  {s.date && <span className="font-mono tnum">{s.date}</span>}
                  {s.date && s.actor && <span className="mx-1.5 text-ink4">·</span>}
                  {s.actor}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
