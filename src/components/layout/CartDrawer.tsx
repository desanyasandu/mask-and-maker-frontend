import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { masks } from "@/lib/mock/data";
import { formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { Button, Drawer } from "../ui/kit";
import { MaskArtwork } from "../ui/MaskImage";

export function CartDrawer() {
  const open = useApp((s) => s.cartOpen);
  const setOpen = useApp((s) => s.setCartOpen);
  const cart = useApp((s) => s.cart);
  const setQty = useApp((s) => s.setQty);
  const removeFromCart = useApp((s) => s.removeFromCart);
  const currency = useApp((s) => s.currency);
  const toast = useApp((s) => s.toast);
  const navigate = useNavigate();

  const items = cart
    .map((i) => ({ ...i, mask: masks.find((m) => m.slug === i.slug) }))
    .filter((i): i is typeof i & { mask: (typeof masks)[number] } => Boolean(i.mask));

  const subtotal = items.reduce((sum, i) => sum + i.mask.priceLKR * i.qty, 0);

  return (
    <Drawer open={open} onClose={() => setOpen(false)} title="Your crate" width="max-w-md">
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="grid size-12 place-items-center rounded-full border border-gold/30 bg-s2">
            <ShoppingBag className="size-5 text-gold" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-lg text-ink">Nothing crated yet</p>
            <p className="mt-1 text-sm text-ink2">One-of-a-kind pieces wait patiently, but not forever.</p>
          </div>
          <Link
            to="/masks"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-sm font-medium text-[#16120A] transition-all duration-100 hover:bg-gold-strong active:scale-[0.98]"
          >
            Browse the collection
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
            {items.map(({ mask, qty }) => (
              <li key={mask.slug} className="flex gap-4 py-4">
                <Link to={`/masks/${mask.slug}`} onClick={() => setOpen(false)} className="shrink-0">
                  <MaskArtwork mask={mask} ratio="" className="size-20 rounded-lg" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/masks/${mask.slug}`} onClick={() => setOpen(false)} className="block truncate text-sm font-medium text-ink hover:text-gold-strong">
                        {mask.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink3">{mask.stock === 1 ? "One of one" : `${mask.stock} in the workshop`} · {mask.region}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[13px] text-ink tnum">{formatMoney(mask.priceLKR * qty, currency)}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-line">
                      <button
                        className="grid size-7 place-items-center text-ink3 transition-colors hover:text-ink disabled:opacity-40"
                        onClick={() => setQty(mask.slug, qty - 1)}
                        disabled={qty <= 1}
                        aria-label={`Decrease quantity of ${mask.name}`}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-7 text-center font-mono text-xs text-ink tnum">{qty}</span>
                      <button
                        className="grid size-7 place-items-center text-ink3 transition-colors hover:text-ink disabled:opacity-40"
                        onClick={() => setQty(mask.slug, Math.min(qty + 1, mask.stock))}
                        disabled={qty >= mask.stock}
                        aria-label={`Increase quantity of ${mask.name}`}
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        removeFromCart(mask.slug);
                        toast("Removed from crate", { description: mask.name });
                      }}
                      className="grid size-7 place-items-center rounded-lg text-ink4 transition-colors hover:bg-s2 hover:text-danger"
                      aria-label={`Remove ${mask.name} from cart`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink2">Subtotal</span>
              <span className="font-mono text-lg text-ink tnum">{formatMoney(subtotal, currency)}</span>
            </div>
            <p className="mt-1 text-xs text-ink3">Insured shipping and export papers calculated at checkout.</p>
            <Button
              size="lg"
              className="mt-4 w-full"
              onClick={() => {
                setOpen(false);
                navigate("/checkout");
              }}
            >
              Proceed to checkout
              <ArrowRight className="size-4" />
            </Button>
            <Link
              to="/cart"
              onClick={() => setOpen(false)}
              className="mt-2 block text-center text-[13px] text-ink3 transition-colors hover:text-ink"
            >
              Review your crate on the cart page
            </Link>
          </div>
        </>
      )}
    </Drawer>
  );
}
