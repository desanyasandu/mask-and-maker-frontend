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
  "admin@maskandmaker.lk",
];

export const isPlatformAdmin = (user?: AuthUser | null): boolean => {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) return true;
  return false;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (user) => {
        const enriched = {
          ...user,
          role: isPlatformAdmin(user) ? ("admin" as const) : (user.role || ("buyer" as const)),
        };
        set({ user: enriched });
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
        const user = {
          ...rawUser,
          role: isPlatformAdmin(rawUser) ? ("admin" as const) : (rawUser.role || ("buyer" as const)),
        };
        return { ...current, user };
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
