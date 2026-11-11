import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, Info, X, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { EXPO } from "@/lib/utils";
import { freezeSmoothScroll, thawSmoothScroll } from "@/lib/smoothScroll";
import type { Photo } from "@/lib/photos";
import { ImageFrame, Pic } from "./MaskImage";

/* ------------------------------------------------ Button ----- */

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

function buttonClass(variant: Variant, size: Size, arrow: boolean, className?: string) {
  return cn(
    "group/btn inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-[background-color,transform,opacity] duration-100 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
    size === "sm" && (arrow ? "h-10 pl-4 pr-1.5 text-[13px]" : "h-10 px-4 text-[13px]"),
    size === "md" && (arrow ? "h-11 pl-5 pr-1.5 text-sm" : "h-11 px-5 text-sm"),
    size === "lg" && (arrow ? "h-12 pl-6 pr-1.5 text-[15px]" : "h-12 px-6 text-[15px]"),
    variant === "primary" && "bg-gold text-on-gold hover:bg-gold-strong",
    variant === "outline" && "border border-gold/60 bg-transparent text-ink hover:bg-gold/10",
    variant === "ghost" && "text-ink2 hover:bg-s2 hover:text-ink",
    variant === "danger" && "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/15",
    className
  );
}

/** The small square chip with an arrow that closes a call-to-action. */
function ArrowChip({ variant, size }: { variant: Variant; size: Size }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/btn:translate-x-0.5",
        size === "lg" ? "size-9" : size === "md" ? "size-8" : "size-7",
        variant === "primary" ? "bg-on-gold text-gold" : "bg-gold text-on-gold"
      )}
    >
      <ArrowRight className="size-4" />
    </span>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** closes the label with an arrow chip (primary and outline only) */
  arrow?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", arrow = false, className, type = "button", children, ...props },
  ref
) {
  const chip = arrow && (variant === "primary" || variant === "outline");
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, chip, className)} {...props}>
      {children}
      {chip && <ArrowChip variant={variant} size={size} />}
    </button>
  );
});

/** A router link that looks like a Button. */
export function ButtonLink({
  to,
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  onClick,
}: {
  to: string;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const chip = arrow && (variant === "primary" || variant === "outline");
  return (
    <Link to={to} onClick={onClick} className={buttonClass(variant, size, chip, className)}>
      {children}
      {chip && <ArrowChip variant={variant} size={size} />}
    </Link>
  );
}

/* ------------------------------------------------ Tag -------- */

const tagTone: Record<string, string> = {
  vermilion: "bg-vermilion",
  forest: "bg-forest border border-white/20",
  gold: "bg-gold",
  neutral: "bg-ink3",
};

export function Tag({ tone = "neutral", children, className }: { tone?: keyof typeof tagTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium capitalize text-ink2", className)}>
      <span className={cn("size-1.5 rounded-full", tagTone[tone])} aria-hidden="true" />
      {children}
    </span>
  );
}

/* ------------------------------------------------ Inputs ----- */

export const inputCls =
  "w-full rounded-lg border border-line bg-s2 px-3.5 h-10 text-sm text-ink placeholder:text-ink3 outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20";

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

export function EmptyState({
  icon: Icon,
  photo,
  title,
  body,
  children,
}: {
  icon?: LucideIcon;
  /** A real photograph shown above the title; replaces the icon when given. */
  photo?: Photo;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-s1 px-6 py-12 text-center">
      {photo ? (
        <div className="mx-auto mb-6 w-full max-w-md">
          <ImageFrame src={photo.src} alt={photo.alt} ratio="aspect-[16/7]" position={photo.position} className="rounded-lg" />
        </div>
      ) : (
        Icon && (
          <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full border border-gold/30 bg-s2">
            <Icon className="size-5 text-gold" aria-hidden="true" />
          </div>
        )
      )}
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink2">{body}</p>
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------ Overlay ---- */

/* Several overlays can be open at once (e.g. a modal launched from a drawer),
   so the page scroll lock is reference-counted rather than set/reset blindly. */
let scrollLocks = 0;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog behaviour: Escape closes, page scroll is locked, focus moves
 * into the panel and returns to the trigger on close, and Tab stays inside.
 * `onClose` is read through a ref so an inline arrow never re-subscribes.
 */
function useOverlay(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    scrollLocks += 1;
    document.body.style.overflow = "hidden";
    freezeSmoothScroll();
    const raf = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
    });
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      scrollLocks = Math.max(0, scrollLocks - 1);
      if (scrollLocks === 0) document.body.style.overflow = "";
      thawSmoothScroll();
      if (trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return { panelRef, onKeyDown };
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
  const { panelRef, onKeyDown } = useOverlay(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div
          ref={panelRef}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 outline-none"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
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
            className={cn("edge relative max-h-full w-full overflow-y-auto rounded-lg bg-s1 shadow-2xl", maxWidth)}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.28, ease: EXPO }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-ink">{title}</h2>
              <button onClick={onClose} aria-label="Close dialog" className="grid size-11 place-items-center rounded-lg text-ink3 transition-colors hover:bg-s2 hover:text-ink">
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

/* ------------------------------------------------ Lightbox -- */

/**
 * Full-screen photograph viewer. Click or press Enter on the picture to flip
 * between fitted and 2x; when zoomed the picture scrolls and can be dragged
 * with the scrollbars or arrow keys. Escape and the close button leave.
 */
export function Lightbox({
  open,
  onClose,
  src,
  alt,
  caption,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  caption?: string;
}) {
  const { panelRef, onKeyDown } = useOverlay(open, onClose);
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    if (!open) setZoomed(false);
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <div ref={panelRef} tabIndex={-1} onKeyDown={onKeyDown} className="fixed inset-0 z-[85] flex flex-col outline-none" role="dialog" aria-modal="true" aria-label={alt}>
          <motion.div
            className="absolute inset-0 bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className="relative flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EXPO }}
          >
            <div className="flex items-center justify-between gap-4 p-4">
              <p className="min-w-0 truncate text-sm text-white/80">{caption ?? alt}</p>
              <button
                onClick={onClose}
                aria-label="Close photograph"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className={cn("min-h-0 flex-1 overflow-auto px-4 pb-6", !zoomed && "grid place-items-center")}>
              <button
                onClick={() => setZoomed((z) => !z)}
                aria-label={zoomed ? "Show the whole photograph" : "Zoom in"}
                aria-pressed={zoomed}
                className={cn("block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold", zoomed ? "mx-auto w-[200%] max-w-none cursor-zoom-out sm:w-[130%]" : "max-h-full cursor-zoom-in")}
              >
                <Pic
                  src={src}
                  alt={alt}
                  eager
                  sizes={zoomed ? "200vw" : "100vw"}
                  className={cn("rounded-lg object-contain", zoomed ? "w-full" : "max-h-[calc(100dvh-9rem)] w-auto max-w-full")}
                />
              </button>
            </div>
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
  const { panelRef, onKeyDown } = useOverlay(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div ref={panelRef} tabIndex={-1} onKeyDown={onKeyDown} className="fixed inset-0 z-[80] outline-none" role="dialog" aria-modal="true" aria-label={title}>
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
                <button onClick={onClose} aria-label="Close panel" className="grid size-11 place-items-center rounded-lg text-ink3 transition-colors hover:bg-s2 hover:text-ink">
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

export function Stepper({
  steps,
  current,
  className,
  onStep,
}: {
  steps: string[];
  current: number;
  className?: string;
  /** when given, finished steps become buttons that jump back to them */
  onStep?: (index: number) => void;
}) {
  return (
    <ol className={cn("flex items-center", className)} aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className={cn("flex items-center", i < steps.length - 1 && "flex-1")} aria-current={active ? "step" : undefined}>
            <div
              className={cn("flex items-center gap-2.5", done && onStep && "cursor-pointer rounded-md hover:opacity-80")}
              role={done && onStep ? "button" : undefined}
              tabIndex={done && onStep ? 0 : undefined}
              aria-label={done && onStep ? `Back to ${label}` : undefined}
              onClick={done && onStep ? () => onStep(i) : undefined}
              onKeyDown={
                done && onStep
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onStep(i);
                      }
                    }
                  : undefined
              }
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[11px] tnum transition-colors duration-180",
                  done && "border-gold bg-gold text-on-gold",
                  active && "border-gold/70 text-gold",
                  !done && !active && "border-line text-ink3"
                )}
              >
                {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden text-[13px] font-medium sm:block", active ? "text-ink" : done ? "text-ink2" : "text-ink3")}>{label}</span>
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
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="grid size-8 place-items-center rounded-md text-ink3 hover:text-ink2">
                <X className="size-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
