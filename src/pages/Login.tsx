import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Modal } from "@/components/ui/kit";
import { LampScene } from "@/components/ui/LampScene";
import { CANCELLED, googleClientId, loadGoogle, signInWithGoogle } from "@/lib/google";
import { usePageMeta } from "@/lib/meta";
import { useApp } from "@/store/app";
import { initialsOf, useAuth, type AuthUser } from "@/store/auth";
import { EXPO } from "@/lib/utils";

/** Only same-site paths are honoured, so a crafted ?next= can't send someone elsewhere. */
export const safeNext = (next: string | null) => (next && /^\/(?!\/|login)/.test(next) ? next : "/account");

/** Why the visitor landed here, when a protected page sent them. */
const reasonFor = (path: string) => (path.startsWith("/account") ? "Your account is private. Sign in to open it." : "");

const sampleAccounts: AuthUser[] = [
  { id: "preview-ruwin", name: "Ruwin Jayasuriya", email: "ruwin.jayasuriya@example.com", provider: "preview" },
  { id: "preview-nimali", name: "Nimali Perera", email: "nimali.perera@example.com", provider: "preview" },
];

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function Login() {
  usePageMeta("Sign in", "Sign in to Mask & Maker with your Google account to keep your orders, certificates and wishlist.");
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const reason = params.get("next") ? reasonFor(next) : "";
  const user = useAuth((s) => s.user);
  const signIn = useAuth((s) => s.signIn);
  const toast = useApp((s) => s.toast);
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [chooser, setChooser] = useState(false);
  const [lamp, setLamp] = useState(true);
  const preview = !googleClientId;

  // load Google's script ahead of the click so its popup opens inside the click
  useEffect(() => {
    if (!preview) loadGoogle().catch(() => {});
  }, [preview]);

  if (user) return <Navigate to={next} replace />;

  const finish = async (u: AuthUser) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: u.id,
          name: u.name,
          email: u.email,
          picture: u.picture,
          provider: u.provider,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("mm_jwt_token", data.token);
        }
        if (data.user) {
          u = {
            ...u,
            role: data.user.role,
            artisanSlug: data.user.artisanSlug,
          };
        }
      }
    } catch {
      // Graceful offline fallback
    }
    signIn(u);
    toast(`Welcome, ${u.name.split(" ")[0]}`, { description: "You're signed in. Your crate and wishlist are kept.", kind: "success" });
  };

  const onGoogle = async () => {
    setError("");
    if (preview) {
      setChooser(true);
      return;
    }
    setBusy(true);
    try {
      finish(await signInWithGoogle());
    } catch (e) {
      if (!(e instanceof Error && e.name === CANCELLED)) {
        setError(e instanceof Error ? e.message : "Google sign-in didn't complete. Please try again.");
      }
      setBusy(false);
    }
  };

  const rise = (i: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: reduce ? 0 : 0.08 * i, ease: EXPO },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <div className="edge grid overflow-hidden rounded-[28px] bg-s1 lg:min-h-[640px] lg:grid-cols-[1.05fr_1fr]">
        {/* the lamp: its light is what the sign-in card is lit by */}
        <LampScene on={lamp} onToggle={() => setLamp((v) => !v)} className="min-h-[250px] sm:min-h-[320px] lg:min-h-0">
          <p className="absolute top-8 left-10 hidden items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-[#ddb983] uppercase lg:flex">
            <span className="h-px w-8 bg-[#ddb983]/70" aria-hidden="true" />
            The Ambalangoda registry
          </p>
          <div className="hidden px-10 pb-10 lg:block">
            <p className="max-w-md font-display text-[38px] leading-[1.1] tracking-[-0.015em] text-white">Every mask arrives with its story.</p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
              Sign in to keep what you collect — the certificate, the maker, the date it left the workshop.
            </p>
          </div>
        </LampScene>

        {/* the sign-in card */}
        <section className="relative flex items-center justify-center px-6 py-8 sm:px-12 sm:py-12" aria-labelledby="signin-title">
          <p
            aria-hidden={lamp}
            className={`absolute inset-x-6 text-center font-display text-lg text-ink3transition-opacity duration-500 ${lamp ? "pointer-events-none opacity-0" : "opacity-100 delay-300"}`}
          >
            Pull the cord to light the way in.
          </p>
          <motion.div
            inert={!lamp}
            initial={false}
            animate={{ opacity: lamp ? 1 : 0, y: lamp || reduce ? 0 : 10 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: lamp && !reduce ? 0.12 : 0, ease: EXPO }}
            className="w-full max-w-sm"
          >
            <motion.span {...rise(0)} className="relative hidden size-14 place-items-center rounded-full sm:grid border border-gold/40 bg-s2 text-gold">
              <span className="absolute inset-[4px] rounded-full border border-gold/20" aria-hidden="true" />
              <ShieldCheck className="size-6" aria-hidden="true" />
            </motion.span>

            {reason && (
              <motion.p {...rise(0)} className="mb-4 flex items-center gap-2 rounded-full border border-gold/30 bg-gold/[0.07] px-3.5 py-2 text-[13.5px] text-ink2">
                <Lock className="size-3.5 shrink-0 text-gold" aria-hidden="true" />
                {reason}
              </motion.p>
            )}
            <motion.h1 {...rise(1)} id="signin-title" className="font-display text-[30px] leading-tight text-ink sm:mt-6">
              Sign in or join
            </motion.h1>
            <motion.p {...rise(2)} className="mt-2 text-[15px] leading-relaxed text-ink2">
              One tap with Google. There's no password to make or remember.
            </motion.p>

            <motion.div {...rise(3)} className="mt-6 sm:mt-8">
              <button
                onClick={onGoogle}
                disabled={busy}
                aria-busy={busy}
                className="group/g relative flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-6 text-[15.5px] font-medium text-[#1f1f1f] shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-[box-shadow,background-color,transform] duration-200 hover:bg-[#f8f9fa] hover:shadow-[0_6px_18px_-6px_rgba(0,0,0,0.35)] focus-visible:outline-offset-4 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
              >
                {busy ? <Loader2 className="size-5 animate-spin text-[#4285F4]" aria-hidden="true" /> : <GoogleG className="size-5" />}
                {busy ? "Waiting for Google…" : "Continue with Google"}
              </button>

              <p role="alert" className="mt-3 text-sm text-danger empty:hidden">
                {error}
              </p>

              <p className="mt-3 flex items-start justify-center gap-2 text-center text-[13px] leading-snug text-ink3">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                We only read your name, email and photo, and never post anything.
              </p>

              <Link
                to="/masks"
                className="mt-5 flex h-12 w-full items-center justify-center rounded-full border border-line text-[14.5px] font-medium text-ink2 transition-colors hover:bg-s2 hover:text-ink"
              >
                Keep browsing as a guest
              </Link>
              <p className="mt-2 text-center text-[12.5px] text-ink3">Checkout works without an account.</p>
            </motion.div>

            <motion.div {...rise(5)} className="mt-7 border-t border-line pt-5">
              <p className="text-[12.5px] leading-relaxed text-ink3">
                By continuing you agree to our{" "}
                <Link to="/legal/terms" className="underline underline-offset-2 hover:text-ink2">
                  Terms of trade
                </Link>{" "}
                and{" "}
                <Link to="/legal/privacy" className="underline underline-offset-2 hover:text-ink2">
                  Privacy notice
                </Link>
                . More ways to sign in will come later.
              </p>
              {preview && (
                <p className="mt-4 rounded-lg border border-dashed border-gold/40 px-3 py-2 text-[12.5px] leading-snug text-ink3">
                  <span className="font-mono text-[11px] text-gold">PREVIEW</span> · sample accounts. Set{" "}
                  <code className="font-mono text-[12px] text-ink2">VITE_GOOGLE_CLIENT_ID</code> for real Google sign-in.
                </p>
              )}
            </motion.div>
          </motion.div>
        </section>
      </div>

      <Modal open={chooser} onClose={() => setChooser(false)} title="Choose an account" maxWidth="max-w-md">
        <p className="text-sm text-ink3">Preview mode · sample accounts only. Nothing leaves your browser.</p>
        <ul className="mt-4 space-y-2">
          {sampleAccounts.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => {
                  setChooser(false);
                  finish(a);
                }}
                className="flex min-h-16 w-full items-center gap-3.5 rounded-lg border border-line bg-s2 px-4 py-3 text-left transition-colors hover:border-gold/50 hover:bg-s3"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-s3 font-display text-sm text-gold">{initialsOf(a.name)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium text-ink">{a.name}</span>
                  <span className="block truncate text-[13px] text-ink3">{a.email}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
