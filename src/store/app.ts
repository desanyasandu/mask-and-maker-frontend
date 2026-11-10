import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getCachedMask } from "../lib/mock/api";
import type { Currency } from "../lib/types";

const stockOf = (slug: string) => getCachedMask(slug)?.stock ?? 1;

export interface CartItem {
  slug: string;
  qty: number;
}

export interface ToastMsg {
  id: number;
  title: string;
  description?: string;
  kind: "default" | "success" | "error";
}

interface AppState {
  cart: CartItem[];
  wishlist: string[];
  currency: Currency;
  toasts: ToastMsg[];
  cartOpen: boolean;
  paletteOpen: boolean;
  cookieChoice: "accepted" | "declined" | null;
  /** Returns false when the piece is unknown or the whole stock is already in the crate. */
  addToCart: (slug: string, qty?: number) => boolean;
  removeFromCart: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
  setCurrency: (c: Currency) => void;
  toast: (title: string, opts?: { description?: string; kind?: ToastMsg["kind"] }) => void;
  dismissToast: (id: number) => void;
  setCartOpen: (open: boolean) => void;
  setPaletteOpen: (open: boolean) => void;
  setCookieChoice: (c: "accepted" | "declined") => void;
}

let toastSeq = 1;

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      currency: "LKR",
      toasts: [],
      cartOpen: false,
      paletteOpen: false,
      cookieChoice: null,

      addToCart: (slug, qty = 1) => {
        const stock = stockOf(slug);
        const have = get().cart.find((i) => i.slug === slug)?.qty ?? 0;
        const next = Math.min(have + qty, stock);
        if (stock === 0 || next <= have) return false;
        set((s) => ({
          cart: s.cart.some((i) => i.slug === slug)
            ? s.cart.map((i) => (i.slug === slug ? { ...i, qty: next } : i))
            : [...s.cart, { slug, qty: next }],
        }));
        return true;
      },

      removeFromCart: (slug) => set((s) => ({ cart: s.cart.filter((i) => i.slug !== slug) })),

      setQty: (slug, qty) =>
        set((s) => ({
          cart:
            qty <= 0
              ? s.cart.filter((i) => i.slug !== slug)
              : s.cart.map((i) => (i.slug === slug ? { ...i, qty: Math.min(qty, stockOf(slug)) } : i)),
        })),

      clearCart: () => set({ cart: [] }),

      toggleWishlist: (slug) =>
        set((s) => ({
          wishlist: s.wishlist.includes(slug) ? s.wishlist.filter((w) => w !== slug) : [...s.wishlist, slug],
        })),

      isWishlisted: (slug) => get().wishlist.includes(slug),

      setCurrency: (currency) => set({ currency }),

      toast: (title, opts) => {
        const id = toastSeq++;
        set((s) => ({ toasts: [...s.toasts, { id, title, description: opts?.description, kind: opts?.kind ?? "default" }] }));
        window.setTimeout(() => get().dismissToast(id), 3600);
      },

      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      setCookieChoice: (cookieChoice) => set({ cookieChoice }),
    }),
    {
      name: "mm-store",
      partialize: (s) => ({ cart: s.cart, wishlist: s.wishlist, currency: s.currency, cookieChoice: s.cookieChoice }),
      /* Persisted state can outlive the catalogue it was saved against (or be
         hand-edited): drop unknown pieces, clamp quantities, ignore bad values. */
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const cart = Array.isArray(p.cart)
          ? p.cart
              .filter((i): i is CartItem => !!i && typeof i.slug === "string" && Number.isFinite(i.qty))
              .map((i) => ({ slug: i.slug, qty: Math.max(1, Math.floor(i.qty)) }))
              .filter((i) => i.qty > 0)
          : current.cart;
        const wishlist = Array.isArray(p.wishlist) ? p.wishlist.filter((w): w is string => typeof w === "string") : current.wishlist;
        return {
          ...current,
          cart,
          wishlist,
          currency: p.currency === "USD" || p.currency === "LKR" ? p.currency : current.currency,
          cookieChoice: p.cookieChoice === "accepted" || p.cookieChoice === "declined" ? p.cookieChoice : null,
        };
      },
    }
  )
);
