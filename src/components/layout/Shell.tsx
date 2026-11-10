import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, User, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/store/app";
import { initialsOf, useAuth, type AuthUser } from "@/store/auth";
import { cn } from "@/utils/cn";
import { Button } from "../ui/kit";
import { FlameBand } from "../art";

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
      <span className="relative grid size-10 shrink-0 place-items-center rounded-lg border border-gold/50 bg-s1 transition-colors group-hover:border-gold">
        <span className="absolute inset-[3px] rounded-[5px] border border-gold/25" aria-hidden="true" />
        <span className="font-display text-[13px] tracking-tight text-gold">M&amp;M</span>
      </span>
      {!compact && (
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="font-display text-[15px] text-ink">Mask &amp; Maker</span>
          <span className="text-[12.5px]  text-ink3">Ambalangoda registry</span>
        </span>
      )}
    </Link>
  );
}

function ThemeToggle() {
  const [light, setLight] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.dataset.theme === "light" : false
  );
  // Until the visitor picks a theme with the button, follow the system setting live.
  useEffect(() => {
    const chosen = () => {
      try {
        return localStorage.getItem("mm-theme") !== null;
      } catch {
        return false; /* storage unavailable: follow the system */
      }
    };
    if (chosen()) return;
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const follow = () => {
      if (chosen()) return;
      document.documentElement.dataset.theme = query.matches ? "light" : "dark";
      setLight(query.matches);
    };
    follow();
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    try {
      localStorage.setItem("mm-theme", next ? "light" : "dark");
    } catch {
      /* private mode / blocked storage: the theme still applies for this visit */
    }
  };
  return (
    <button
      onClick={toggle}
      data-spot
      aria-label={light ? "Switch to dark theme" : "Switch to gallery light theme"}
      className="grid size-11 place-items-center rounded-full border border-line text-ink2 transition-colors hover:bg-s2 hover:text-ink"
    >
      {light ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}

export function Avatar({ user, className }: { user: AuthUser; className?: string }) {
  const [broken, setBroken] = useState(false);
  return user.picture && !broken ? (
    <img
      src={user.picture}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className={cn("rounded-full object-cover", className)}
    />
  ) : (
    <span className={cn("grid place-items-center rounded-full bg-s3 font-display text-gold", className)} aria-hidden="true">
      {initialsOf(user.name)}
    </span>
  );
}

export function useSignOut() {
  const signOut = useAuth((s) => s.signOut);
  const toast = useApp((s) => s.toast);
  const navigate = useNavigate();
  return () => {
    signOut();
    toast("You're signed out", { description: "Your crate and wishlist stay on this device." });
    navigate("/");
  };
}

function AccountMenu() {
  const user = useAuth((s) => s.user);
  const doSignOut = useSignOut();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        wrap.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        to="/login"
        data-spot
        className="hidden h-11 items-center gap-2 rounded-full border border-line px-4 text-[13.5px] font-medium whitespace-nowrap text-ink2 transition-colors hover:bg-s2 hover:text-ink sm:inline-flex"
      >
        <User className="size-4" aria-hidden="true" />
        Sign in
      </Link>
    );
  }

  return (
    <div ref={wrap} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        data-spot
        aria-label={`Account menu for ${user.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-gold/60"
      >
        <Avatar user={user} className="size-9 text-[13px]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 origin-top-right rounded-2xl border border-line bg-canvas p-2 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Avatar user={user} className="size-10 shrink-0 text-sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                <p className="truncate text-[12.5px] text-ink3">{user.email}</p>
              </div>
            </div>
            <div className="my-1 h-px bg-line" />
            <Link role="menuitem" to="/account" className="flex min-h-11 items-center rounded-lg px-3 text-sm text-ink2 hover:bg-s2 hover:text-ink">
              Your account
            </Link>
            <button
              role="menuitem"
              onClick={doSignOut}
              className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-ink2 hover:bg-s2 hover:text-ink"
            >
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The spotlight's cone: a bright cap on the bar's top edge and light falling away below it. */
const coneStyle = {
  clipPath: "polygon(24% 0, 76% 0, 100% 100%, 0 100%)",
  background: "linear-gradient(to bottom, color-mix(in srgb, var(--gold) 38%, transparent), color-mix(in srgb, var(--gold) 3%, transparent))",
};

function SpotCap() {
  return <span className="absolute inset-x-[24%] top-0 h-[3px] rounded-b-full bg-gold-strong shadow-[0_0_10px_var(--gold)]" aria-hidden="true" />;
}

/** The same light, held still, behind the current page in the mobile menu. */
function ActiveBeam() {
  return (
    <>
      <span className="absolute inset-0 -z-10" style={{ background: "linear-gradient(to bottom, color-mix(in srgb, var(--gold) 20%, transparent), transparent 85%)" }} aria-hidden="true" />
      <span className="absolute inset-x-[30%] top-0 h-[2px] rounded-b-full bg-gold-strong shadow-[0_0_8px_var(--gold)]" aria-hidden="true" />
    </>
  );
}

type Spot = { x: number; w: number };

export function Header() {
  const user = useAuth((s) => s.user);
  const doSignOut = useSignOut();
  const setPaletteOpen = useApp((s) => s.setPaletteOpen);
  const setCartOpen = useApp((s) => s.setCartOpen);
  const cartCount = useApp((s) => s.cart.reduce((n, i) => n + i.qty, 0));
  const paletteOpen = useApp((s) => s.paletteOpen);
  const currency = useApp((s) => s.currency);
  const setCurrency = useApp((s) => s.setCurrency);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const reduce = useReducedMotion();

  /* One spotlight for the whole bar: it follows the pointer or keyboard focus across anything
     marked data-spot, and rests on the current page when nothing is under it. */
  const bar = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<Spot | null>(null);
  const lit = useRef(false);
  const measure = useCallback((el: Element | null | undefined): Spot | null => {
    if (!el || !bar.current) return null;
    const b = bar.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return r.width ? { x: r.left - b.left + r.width / 2, w: r.width } : null;
  }, []);
  const rest = useCallback(() => measure(bar.current?.querySelector('[data-spot][aria-current="page"]')), [measure]);
  const aim = (e: { target: EventTarget }) => {
    const el = (e.target as HTMLElement).closest("[data-spot]");
    if (el) setSpot(measure(el));
  };
  useEffect(() => {
    lit.current = spot !== null;
  }, [spot]);
  useEffect(() => {
    const settle = () => setSpot(rest());
    settle();
    window.addEventListener("resize", settle);
    document.fonts?.ready.then(settle);
    return () => window.removeEventListener("resize", settle);
  }, [rest, location.pathname]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  /* Escape closes the mobile menu, and opening search shouldn't leave it hanging */
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);
  useEffect(() => {
    if (paletteOpen) setMobileOpen(false);
  }, [paletteOpen]);

  return (
    <header className="sticky top-0 z-[60] px-3 pt-3 sm:px-6">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-on-gold"
      >
        Skip to content
      </a>
      <div
        ref={bar}
        onPointerOver={(e) => e.pointerType !== "touch" && aim(e)}
        onPointerLeave={() => setSpot(rest())}
        onFocus={aim}
        onBlur={() => setSpot(rest())}
        className="relative isolate mx-auto flex h-16 max-w-7xl items-center gap-3 rounded-full border border-line bg-canvas/95 pl-4 pr-2.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:pl-5"
      >
        {spot && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 left-0 -z-10"
            initial={false}
            animate={{ x: spot.x - Math.max(spot.w + 28, 60) / 2, width: Math.max(spot.w + 28, 60), opacity: 1 }}
            transition={
              reduce
                ? { duration: 0 }
                : lit.current
                  ? { type: "spring", stiffness: 420, damping: 36 }
                  : { x: { duration: 0 }, width: { duration: 0 }, opacity: { duration: 0.25 } }
            }
          >
            <span className="absolute inset-0" style={coneStyle} />
            <SpotCap />
          </motion.div>
        )}
        <Wordmark />
        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-spot
              className={({ isActive }) =>
                cn(
                  "relative rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-180",
                  isActive ? "text-ink" : "text-ink3 hover:text-ink2"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setPaletteOpen(true)}
            data-spot
            className="hidden h-11 items-center gap-2 rounded-full border border-line bg-s1 px-3 text-[13px] text-ink3 transition-colors hover:bg-s2 hover:text-ink2 md:inline-flex"
            aria-label="Search (Ctrl K)"
          >
            <Search className="size-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">Search the registry</span>
            <kbd className="kbd ml-1">⌘K</kbd>
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            data-spot
            className="grid size-11 place-items-center rounded-full border border-line text-ink2 transition-colors hover:bg-s2 hover:text-ink md:hidden"
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>

          <div className="hidden items-center rounded-full border border-line bg-s1 p-0.5 font-mono text-[11px] sm:flex" role="group" aria-label="Currency">
            {(["LKR", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                data-spot
                aria-pressed={currency === c}
                className={cn(
                  "h-9 rounded-full px-3 transition-colors duration-180 tnum",
                  currency === c ? "bg-s3 text-gold" : "text-ink3 hover:text-ink2"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <ThemeToggle />

          <AccountMenu />

          <button
            onClick={() => setCartOpen(true)}
            className="group/btn inline-flex h-11 items-center gap-2 rounded-full bg-gold pl-3.5 pr-1.5 text-on-gold transition-colors hover:bg-gold-strong active:scale-[0.98] sm:pl-4"
            aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? "piece" : "pieces"}`}
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            <span className="hidden text-[13.5px] font-medium sm:inline">Your crate</span>
            <span className="grid size-8 place-items-center rounded-full bg-on-gold font-mono text-[12px] text-gold transition-transform duration-200 group-hover/btn:translate-x-0.5 tnum">
              {cartCount}
            </span>
          </button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            data-spot
            className="grid size-11 place-items-center rounded-full border border-line text-ink2 lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            aria-label="Mobile"
            className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-3xl border border-line bg-canvas shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] lg:hidden"
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
                    cn("relative isolate block overflow-hidden rounded-lg px-3 py-2.5 text-[15px] font-medium", isActive ? "text-gold" : "text-ink2")
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <ActiveBeam />}
                      {l.label}
                    </>
                  )}
                </NavLink>
              ))}
              <NavLink
                to={user ? "/account" : "/login"}
                className={({ isActive }) =>
                  cn("relative isolate block overflow-hidden rounded-lg px-3 py-2.5 text-[15px] font-medium sm:hidden", isActive ? "text-gold" : "text-ink2")
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <ActiveBeam />}
                    {user ? "Your account" : "Sign in"}
                  </>
                )}
              </NavLink>
              {user && (
                <button
                  onClick={doSignOut}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-ink2 sm:hidden"
                >
                  Sign out
                </button>
              )}
              <div className="flex items-center gap-3 px-3 pt-2 pb-1 sm:hidden">
                <span className="text-[12.5px]  text-ink3">Currency</span>
                {(["LKR", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={cn("min-h-11 rounded-full border px-4 font-mono text-[12px] tnum", currency === c ? "border-gold/50 text-gold" : "border-line text-ink3")}
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
  { to: "/legal/credits", label: "Picture credits" },
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
      <FlameBand tall />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-ink2">
              Hand-carved Kaduru masks from Sri Lanka's southern masters — with provenance you can check, prices you can trust,
              and the maker's name on the back.
            </p>
            <form onSubmit={subscribe} className="mt-6" aria-label="Newsletter">
              <label htmlFor="footer-news" className="mb-2 block text-[12.5px] font-medium  text-ink3">
                The registry letter
              </label>
              <div className="flex max-w-sm gap-2">
                <input
                  id="footer-news"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 w-full rounded-lg border border-line bg-s2 px-3.5 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
                <Button type="submit">Join</Button>
              </div>
              <p className="mt-2 text-xs text-ink3">One letter a month. No noise, no resale of your address.</p>
            </form>
          </div>

          <nav aria-label="Explore" className="text-sm">
            <p className="mb-3 text-[12.5px] font-medium  text-ink3">Explore</p>
            <ul className="space-y-2.5">
              {exploreLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-ink2 transition-colors hover:text-gold-strong">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Registry" className="text-sm">
            <p className="mb-3 text-[12.5px] font-medium  text-ink3">Registry</p>
            <ul className="space-y-2.5">
              {registryLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-ink2 transition-colors hover:text-gold-strong">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal" className="text-sm">
            <p className="mb-3 text-[12.5px] font-medium  text-ink3">House rules</p>
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
          <p className="text-[13px] text-ink3">© 2026 Mask &amp; Maker (Pvt) Ltd · Ambalangoda, Sri Lanka</p>
          <p className="flex items-center gap-2 text-[13px] text-ink3">
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
      className="edge fixed bottom-3 left-3 z-[65] w-[calc(100%-1.5rem)] max-w-sm rounded-lg bg-s2 px-3 py-2 shadow-2xl"
      role="region"
      aria-label="Cookie notice"
    >
      <p className="text-[13px] leading-snug text-ink2">
        <strong className="text-ink">Cookies</strong> help remember your cart and currency and measure site visits.
      </p>
      <div className="mt-1 flex flex-wrap gap-x-2">
        <Button size="sm" className="min-h-11" onClick={() => setChoice("accepted")}>Accept all</Button>
        <Button size="sm" className="min-h-11" variant="ghost" onClick={() => setChoice("declined")}>Essential only</Button>
      </div>
    </motion.div>
  );
}
