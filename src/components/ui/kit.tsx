import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, type LucideIcon } from "lucide-react";
import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { EXPO } from "@/lib/utils";

/* ------------------------------------------------ Button ----- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium transition-all duration-100 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-[15px]",
        variant === "primary" && "bg-gold text-[#16120A] shadow-[0_1px_0_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-gold-strong",
        variant === "outline" && "edge bg-s2 text-ink hover:bg-s3",
        variant === "ghost" && "text-ink2 hover:bg-s2 hover:text-ink",
        variant === "danger" && "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/15",
        className
      )}
      {...props}
    />
  );
});

/* ------------------------------------------------ Tag -------- */

const tagTone: Record<string, string> = {
  vermilion: "bg-vermilion",
  forest: "bg-forest border border-white/20",
  gold: "bg-gold",
  neutral: "bg-ink3",
};

export function Tag({ tone = "neutral", children, className }: { tone?: keyof typeof tagTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink2", className)}>
      <span className={cn("size-1.5 rounded-full", tagTone[tone])} aria-hidden="true" />
      {children}
    </span>
  );
}

/* ------------------------------------------------ Inputs ----- */

export const inputCls =
  "w-full rounded-lg border border-line bg-s2 px-3.5 h-10 text-sm text-ink placeholder:text-ink4 outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputCls, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputCls, "h-auto min-h-24 py-2.5", className)} {...props} />;
});

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink2">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-ink3">{hint}</span>
      ) : null}
    </label>
  );
}

/* ------------------------------------------------ Skeleton --- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skel rounded-lg", className)} />;
}

/* ------------------------------------------------ EmptyState - */

export function EmptyState({ icon: Icon, title, body, children }: { icon: LucideIcon; title: string; body: string; children?: ReactNode }) {
  return (
    <div className="edge rounded-lg bg-s1 px-6 py-14 text-center">
      <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full border border-gold/30 bg-s2">
        <Icon className="size-5 text-gold" aria-hidden="true" />
      </div>
      <h3 className="font-display text-lg text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink2">{body}</p>
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------ Modal ------ */

export function Modal({
  open,
  onClose,
  children,
  title,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--scrim)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className={cn("edge relative w-full rounded-lg bg-s1 shadow-2xl", maxWidth)}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.28, ease: EXPO }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-ink">{title}</h2>
              <button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-ink3 transition-colors hover:bg-s2 hover:text-ink">
                <X className="size-4" />
              </button>
            </div>
            <div className="px-5 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------ Drawer ----- */

export function Drawer({
  open,
  onClose,
  children,
  title,
  side = "right",
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  side?: "right" | "left";
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--scrim)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.aside
            className={cn(
              "edge absolute inset-y-0 flex w-full flex-col bg-s1",
              side === "right" ? "right-0 border-y-0 border-r-0" : "left-0 border-y-0 border-l-0",
              width
            )}
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ duration: 0.32, ease: EXPO }}
          >
            {title !== undefined && (
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-display text-lg text-ink">{title}</h2>
                <button onClick={onClose} aria-label="Close panel" className="rounded-lg p-1.5 text-ink3 transition-colors hover:bg-s2 hover:text-ink">
                  <X className="size-4" />
                </button>
              </div>
            )}
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------ Stepper ---- */

export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol className={cn("flex items-center", className)} aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[11px] tnum transition-colors duration-180",
                  done && "border-gold bg-gold text-[#16120A]",
                  active && "border-gold/70 text-gold",
                  !done && !active && "border-line text-ink4"
                )}
              >
                {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden text-[13px] font-medium sm:block", active ? "text-ink" : done ? "text-ink2" : "text-ink4")}>{label}</span>
            </div>
            {i < steps.length - 1 && <span className={cn("mx-3 h-px flex-1", i < current ? "bg-gold/50" : "bg-line")} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------ Toasts ----- */

const toastIcon: Record<string, LucideIcon> = { default: Info, success: CheckCircle2, error: AlertTriangle };
const toastTone: Record<string, string> = { default: "text-ink2", success: "text-gold", error: "text-danger" };

export function ToastHost() {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = toastIcon[t.kind] ?? Info;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: EXPO }}
              className="edge pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-s2 px-4 py-3 shadow-xl"
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", toastTone[t.kind])} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] leading-snug text-ink2">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="rounded p-0.5 text-ink4 hover:text-ink2">
                <X className="size-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
