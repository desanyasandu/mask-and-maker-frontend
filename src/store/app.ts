import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Currency } from "../lib/types";

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
  addToCart: (slug: string, qty?: number) => void;
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

      addToCart: (slug, qty = 1) =>
        set((s) => {
          const existing = s.cart.find((i) => i.slug === slug);
          return {
            cart: existing
              ? s.cart.map((i) => (i.slug === slug ? { ...i, qty: i.qty + qty } : i))
              : [...s.cart, { slug, qty }],
          };
        }),

      removeFromCart: (slug) => set((s) => ({ cart: s.cart.filter((i) => i.slug !== slug) })),

      setQty: (slug, qty) =>
        set((s) => ({
          cart: qty <= 0 ? s.cart.filter((i) => i.slug !== slug) : s.cart.map((i) => (i.slug === slug ? { ...i, qty } : i)),
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
    }
  )
);
