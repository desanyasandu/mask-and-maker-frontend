import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role?: "buyer" | "artisan" | "verifier" | "admin";
  artisanSlug?: string;
  /** "preview" is the sample account chooser used when no Google client id is configured */
  provider: "google" | "preview";
}

interface AuthState {
  user: AuthUser | null;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

const isUser = (v: unknown): v is AuthUser => {
  const u = v as Partial<AuthUser> | null;
  return !!u && typeof u.id === "string" && typeof u.name === "string" && typeof u.email === "string";
};

export const ADMIN_EMAILS = [
  "kushanherath59@gmail.com",
];

/** Strict admin check — ONLY true if user.email matches authorized admin email */
export const isPlatformAdmin = (user?: AuthUser | null): boolean => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
};

/** Sanitizes user role — elevates admin email, but strips admin role from any other email */
export const sanitizeAuthUser = (user: AuthUser | null): AuthUser | null => {
  if (!user) return null;
  const admin = isPlatformAdmin(user);
  if (admin) {
    return { ...user, role: "admin" };
  }
  // For ANY other email, NEVER allow role to be "admin"
  const safeRole = user.role === "admin" ? "buyer" : (user.role || "buyer");
  return { ...user, role: safeRole };
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (user) => {
        set({ user: sanitizeAuthUser(user) });
      },
      signOut: () => set({ user: null }),
    }),
    {
      name: "mm-auth",
      partialize: (s) => ({ user: s.user }),
      // a hand-edited or stale value must never count as a signed-in visitor
      merge: (persisted, current) => {
        const rawUser = (persisted as Partial<AuthState> | undefined)?.user;
        if (!isUser(rawUser)) return { ...current, user: null };
        return { ...current, user: sanitizeAuthUser(rawUser) };
      },
    }
  )
);

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "?";
