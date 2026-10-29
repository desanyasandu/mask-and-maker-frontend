import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, User } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { Button } from "../ui/kit";

const navLinks = [
  { to: "/masks", label: "Collection" },
  { to: "/artisans", label: "Artisans" },
  { to: "/heritage", label: "Folklore" },
  { to: "/verify", label: "Verify" },
  { to: "/about", label: "Impact" },
];

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Mask & Maker home">
      <span className="relative grid size-9 shrink-0 place-items-center rounded-lg border border-gold/50 bg-s1 transition-colors group-hover:border-gold">
        <span className="absolute inset-[3px] rounded-[5px] border border-gold/25" aria-hidden="true" />
        <span className="font-display text-[13px] tracking-tight text-gold">M&amp;M</span>
      </span>
      {!compact && (
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="font-display text-[15px] text-ink">Mask &amp; Maker</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink3">Ambalangoda registry</span>
        </span>
      )}
    </Link>
  );
}

function ThemeToggle() {
  const [light, setLight] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.dataset.theme === "light" : false
  );
  useEffect(() => {
    const stored = localStorage.getItem("mm-theme");
    if (stored === "light") {
      document.documentElement.dataset.theme = "light";
      setLight(true);
    }
  }, []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("mm-theme", next ? "light" : "dark");
  };
  return (
    <button
      onClick={toggle}
      aria-label={light ? "Switch to dark theme" : "Switch to gallery light theme"}
      className="grid size-9 place-items-center rounded-lg border border-line text-ink2 transition-colors hover:bg-s2 hover:text-ink"
    >
      {light ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}

export function Header() {
  const setPaletteOpen = useApp((s) => s.setPaletteOpen);
  const setCartOpen = useApp((s) => s.setCartOpen);
  const cartCount = useApp((s) => s.cart.reduce((n, i) => n + i.qty, 0));
  const currency = useApp((s) => s.currency);
  const setCurrency = useApp((s) => s.setCurrency);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-[60] border-b border-line bg-canvas/85 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-[#16120A]"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Wordmark />
        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "relative rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors duration-180",
                  isActive ? "text-ink" : "text-ink3 hover:text-ink2"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-[1px] h-px bg-gold" transition={{ duration: 0.3 }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-s1 px-3 text-[13px] text-ink3 transition-colors hover:bg-s2 hover:text-ink2 md:inline-flex"
            aria-label="Search (Ctrl K)"
          >
            <Search className="size-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">Search the registry</span>
            <kbd className="kbd ml-1">⌘K</kbd>
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="grid size-9 place-items-center rounded-lg border border-line text-ink2 transition-colors hover:bg-s2 hover:text-ink md:hidden"
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>

          <div className="hidden items-center rounded-lg border border-line bg-s1 p-0.5 font-mono text-[11px] sm:flex" role="group" aria-label="Currency">
            {(["LKR", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className={cn(
                  "h-7 rounded-md px-2 transition-colors duration-180 tnum",
                  currency === c ? "bg-s3 text-gold" : "text-ink3 hover:text-ink2"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <ThemeToggle />

          <Link
            to="/account"
            className="hidden size-9 place-items-center rounded-lg border border-line text-ink2 transition-colors hover:bg-s2 hover:text-ink sm:grid"
            aria-label="Your account"
          >
            <User className="size-4" />
          </Link>

          <button
            onClick={() => setCartOpen(true)}
            className="relative grid size-9 place-items-center rounded-lg border border-line text-ink2 transition-colors hover:bg-s2 hover:text-ink"
            aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? "piece" : "pieces"}`}
          >
            <ShoppingBag className="size-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid size-[18px] place-items-center rounded-full bg-gold font-mono text-[10px] font-medium text-[#16120A] tnum">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-lg border border-line text-ink2 lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            aria-label="Mobile"
            className="border-t border-line bg-canvas lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            <div className="space-y-1 px-4 py-3">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn("block rounded-lg px-3 py-2.5 text-[15px] font-medium", isActive ? "bg-s2 text-gold" : "text-ink2")
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="flex items-center gap-3 px-3 pt-2 pb-1 sm:hidden">
                <span className="text-[11px] uppercase tracking-[0.14em] text-ink4">Currency</span>
                {(["LKR", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={cn("rounded-md border px-2 py-1 font-mono text-[11px] tnum", currency === c ? "border-gold/50 text-gold" : "border-line text-ink3")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ================================================================ */

const exploreLinks = [
  { to: "/masks", label: "The collection" },
  { to: "/masks?tradition=raksha", label: "Raksha guardians" },
  { to: "/masks?tradition=sanni", label: "Sanni healers" },
  { to: "/masks?tradition=kolam", label: "Kolam theatre" },
  { to: "/artisans", label: "Meet the makers" },
];

const registryLinks = [
  { to: "/verify", label: "Verify a certificate" },
  { to: "/heritage", label: "Folklore hub" },
  { to: "/about", label: "Impact & mission" },
  { to: "/portal", label: "Artisan portal" },
  { to: "/account", label: "Your account" },
];

const legalLinks = [
  { to: "/legal/privacy", label: "Privacy" },
  { to: "/legal/terms", label: "Terms of trade" },
  { to: "/legal/shipping", label: "Shipping & care" },
];

export function Footer() {
  const toast = useApp((s) => s.toast);
  const [email, setEmail] = useState("");

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast("That address doesn't look right", { description: "Check the spelling and try again.", kind: "error" });
      return;
    }
    toast("You're on the registry list", { description: "One considered letter a month — new pieces, maker stories, folklore.", kind: "success" });
    setEmail("");
  };

  return (
    <footer className="mt-24 border-t border-line bg-s1" role="contentinfo">
      <div className="flame-divider" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink2">
              Hand-carved Kaduru masks from Sri Lanka's southern masters — with provenance you can check, prices you can trust,
              and the maker's name on the back.
            </p>
            <form onSubmit={subscribe} className="mt-6" aria-label="Newsletter">
              <label htmlFor="footer-news" className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink3">
                The registry letter
              </label>
              <div className="flex max-w-sm gap-2">
                <input
                  id="footer-news"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 w-full rounded-lg border border-line bg-s2 px-3.5 text-sm text-ink outline-none transition placeholder:text-ink4 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
                <Button type="submit">Join</Button>
              </div>
              <p className="mt-2 text-xs text-ink3">One letter a month. No noise, no resale of your address.</p>
            </form>
          </div>

          <nav aria-label="Explore" className="text-sm">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-ink3">Explore</p>
            <ul className="space-y-2.5">
              {exploreLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-ink2 transition-colors hover:text-gold-strong">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Registry" className="text-sm">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-ink3">Registry</p>
            <ul className="space-y-2.5">
              {registryLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-ink2 transition-colors hover:text-gold-strong">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal" className="text-sm">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-ink3">House rules</p>
            <ul className="space-y-2.5">
              {legalLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-ink2 transition-colors hover:text-gold-strong">{l.label}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-2" aria-label="Payment methods">
              {["VISA", "MC", "AMEX", "PAYHERE"].map((p) => (
                <span key={p} className="rounded-md border border-line bg-s2 px-1.5 py-1 font-mono text-[9px] tracking-wide text-ink3 tnum">{p}</span>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] text-ink4 tnum">© 2026 Mask &amp; Maker (Pvt) Ltd · Ambalangoda, Sri Lanka</p>
          <p className="flex items-center gap-2 font-mono text-[11px] text-ink4 tnum">
            <Heart className="size-3 text-vermilion" aria-hidden="true" />
            61% of every sale reaches the workshop that made it
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ================================================================ */

export function CookieNotice() {
  const choice = useApp((s) => s.cookieChoice);
  const setChoice = useApp((s) => s.setCookieChoice);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (choice !== null) return;
    const t = window.setTimeout(() => setShow(true), 1400);
    return () => window.clearTimeout(t);
  }, [choice]);

  if (choice !== null || !show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="edge fixed bottom-4 left-4 z-[65] w-[calc(100%-2rem)] max-w-sm rounded-lg bg-s2 p-4 shadow-2xl"
      role="region"
      aria-label="Cookie notice"
    >
      <p className="text-sm font-medium text-ink">A word on cookies</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink2">
        We keep your crate and currency on this device, and measure the pages — nothing follows you off the registry.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => setChoice("accepted")}>That's fair</Button>
        <Button size="sm" variant="ghost" onClick={() => setChoice("declined")}>Essential only</Button>
      </div>
    </motion.div>
  );
}
