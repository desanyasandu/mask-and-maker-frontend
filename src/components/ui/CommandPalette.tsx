import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Drama, Hammer, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/mock/api";
import type { SearchHit } from "@/lib/types";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { EXPO } from "@/lib/utils";

const pages: SearchHit[] = [
  { kind: "page", title: "Collection", subtitle: "All masks", href: "/masks" },
  { kind: "page", title: "Artisans", subtitle: "The makers", href: "/artisans" },
  { kind: "page", title: "Folklore Hub", subtitle: "Traditions & essays", href: "/heritage" },
  { kind: "page", title: "Verify a certificate", subtitle: "QR / NFC check", href: "/verify" },
  { kind: "page", title: "Impact & mission", subtitle: "Why we exist", href: "/about" },
  { kind: "page", title: "Your account", subtitle: "Orders & digital twins", href: "/account" },
];

const kindIcon = { mask: Drama, artisan: Hammer, article: BookOpen, page: ArrowRight } as const;
const kindLabel = { mask: "Masks", artisan: "Artisans", article: "Folklore", page: "Pages" } as const;

export function CommandPalette() {
  const open = useApp((s) => s.paletteOpen);
  const setOpen = useApp((s) => s.setPaletteOpen);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  /* global Ctrl/⌘+K */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useApp.getState().paletteOpen);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  /* debounced search */
  useEffect(() => {
    let alive = true;
    const t = window.setTimeout(async () => {
      const found = q.trim() ? await api.search(q) : [];
      if (alive) setHits(found);
    }, 120);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [q]);

  const results = useMemo<SearchHit[]>(() => {
    const query = q.trim().toLowerCase();
    const pageHits = query ? pages.filter((p) => p.title.toLowerCase().includes(query)) : pages.slice(0, 3);
    return [...hits, ...pageHits].slice(0, 9);
  }, [q, hits]);

  const grouped = useMemo(() => {
    const order: SearchHit[] = [];
    (Object.keys(kindLabel) as Array<keyof typeof kindLabel>).forEach((k) => {
      results.filter((r) => r.kind === k).forEach((r) => order.push(r));
    });
    return order;
  }, [results]);

  const pick = (hit: SearchHit) => {
    setOpen(false);
    navigate(hit.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, grouped.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && grouped[idx]) {
      e.preventDefault();
      pick(grouped[idx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  let lastKind: SearchHit["kind"] | null = null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85] flex items-start justify-center px-4 pt-[16vh]" role="dialog" aria-modal="true" aria-label="Search Mask and Maker">
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--scrim)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="edge relative w-full max-w-lg overflow-hidden rounded-lg bg-s1 shadow-2xl"
            initial={{ opacity: 0, y: -10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.995 }}
            transition={{ duration: 0.22, ease: EXPO }}
          >
            <div className="flex items-center gap-2.5 border-b border-line px-4">
              <Search className="size-4 shrink-0 text-ink3" aria-hidden="true" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIdx(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search masks, artisans, folklore…"
                className="h-12 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink4"
                role="combobox"
                aria-expanded="true"
                aria-controls="mm-palette-list"
                aria-activedescendant={grouped[idx] ? `mm-hit-${idx}` : undefined}
                aria-label="Search"
              />
              <kbd className="kbd shrink-0">esc</kbd>
            </div>

            <div className="max-h-[46vh] overflow-y-auto p-1.5" id="mm-palette-list" role="listbox">
              {grouped.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-ink3">
                  Nothing in the registry matches “{q}”. Try a tradition — raksha, sanni, kolam — or a maker's region.
                </p>
              )}
              {grouped.map((hit, i) => {
                const header = hit.kind !== lastKind;
                lastKind = hit.kind;
                const Icon = kindIcon[hit.kind];
                return (
                  <div key={`${hit.kind}-${hit.href}-${hit.title}`}>
                    {header && (
                      <p className="px-3 pt-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink4">{kindLabel[hit.kind]}</p>
                    )}
                    <button
                      id={`mm-hit-${i}`}
                      role="option"
                      aria-selected={i === idx}
                      onMouseEnter={() => setIdx(i)}
                      onClick={() => pick(hit)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors duration-100",
                        i === idx ? "bg-s3" : "bg-transparent"
                      )}
                    >
                      <span className={cn("grid size-7 shrink-0 place-items-center rounded-md border", i === idx ? "border-gold/40 text-gold" : "border-line text-ink3")}>
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{hit.title}</span>
                        <span className="block truncate text-xs text-ink3">{hit.subtitle}</span>
                      </span>
                      {i === idx && <ArrowRight className="size-3.5 shrink-0 text-gold" aria-hidden="true" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[11px] text-ink4">
              <span className="flex items-center gap-1.5"><kbd className="kbd">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1.5"><kbd className="kbd">↵</kbd> open</span>
              <span className="ml-auto hidden sm:block">The registry, at a keystroke</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
