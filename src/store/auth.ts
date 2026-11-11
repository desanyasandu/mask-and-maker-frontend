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

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),
    }),
    {
      name: "mm-auth",
      partialize: (s) => ({ user: s.user }),
      // a hand-edited or stale value must never count as a signed-in visitor
      merge: (persisted, current) => {
        const user = (persisted as Partial<AuthState> | undefined)?.user;
        return { ...current, user: isUser(user) ? user : null };
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
