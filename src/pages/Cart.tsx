import { ArrowRight, Minus, Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { masks } from "@/lib/mock/data";
import { usePageMeta } from "@/lib/meta";
import { formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { EmptyState } from "@/components/ui/kit";
import { MaskArtwork } from "@/components/ui/MaskImage";
import { TraditionTag } from "@/components/MaskCard";

export default function Cart() {
  usePageMeta("Your crate");
  const cart = useApp((s) => s.cart);
  const setQty = useApp((s) => s.setQty);
  const removeFromCart = useApp((s) => s.removeFromCart);
  const clearCart = useApp((s) => s.clearCart);
  const currency = useApp((s) => s.currency);
  const toast = useApp((s) => s.toast);

  const items = cart
    .map((i) => ({ ...i, mask: masks.find((m) => m.slug === i.slug) }))
    .filter((i): i is typeof i & { mask: (typeof masks)[number] } => Boolean(i.mask));

  const subtotal = items.reduce((sum, i) => sum + i.mask.priceLKR * i.qty, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">Checkout</p>
      <h1 className="mt-2 font-display text-[34px] leading-tight text-ink">Your crate</h1>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={ShoppingBag}
            title="The crate is empty"
            body="Each piece here is one of one — the good ones don't linger. Have a look round the collection while the shelf is full."
          >
            <Link to="/masks" className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold px-4 text-sm font-medium text-[#16120A] transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]">
              Browse the collection
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-line border-y border-line">
            {items.map(({ mask, qty }) => (
              <li key={mask.slug} className="flex gap-5 py-6">
                <Link to={`/masks/${mask.slug}`} className="shrink-0">
                  <MaskArtwork mask={mask} ratio="" className="size-24 rounded-lg sm:size-32" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link to={`/masks/${mask.slug}`} className="font-display text-lg leading-snug text-ink transition-colors hover:text-gold-strong">
                        {mask.name}
                      </Link>
                      <p className="mt-1 text-xs text-ink3">
                        {mask.heightCm} cm · {mask.weightKg} kg · {mask.region}
                      </p>
                      <TraditionTag tradition={mask.tradition} className="mt-2" />
                    </div>
                    <span className="shrink-0 font-mono text-[15px] text-ink tnum">{formatMoney(mask.priceLKR * qty, currency)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-line">
                      <button
                        className="grid size-8 place-items-center text-ink3 transition-colors hover:text-ink disabled:opacity-40"
                        onClick={() => setQty(mask.slug, qty - 1)}
                        disabled={qty <= 1}
                        aria-label={`Decrease quantity of ${mask.name}`}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono text-sm text-ink tnum">{qty}</span>
                      <button
                        className="grid size-8 place-items-center text-ink3 transition-colors hover:text-ink disabled:opacity-40"
                        onClick={() => setQty(mask.slug, Math.min(qty + 1, mask.stock))}
                        disabled={qty >= mask.stock}
                        aria-label={`Increase quantity of ${mask.name}`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-ink4 tnum">{formatMoney(mask.priceLKR, currency)} each</span>
                      <button
                        onClick={() => {
                          removeFromCart(mask.slug);
                          toast("Removed from crate", { description: mask.name });
                        }}
                        className="grid size-8 place-items-center rounded-lg text-ink4 transition-colors hover:bg-s2 hover:text-danger"
                        aria-label={`Remove ${mask.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="edge sticky top-24 rounded-lg bg-s2 p-6" aria-label="Order summary">
            <h2 className="font-display text-lg text-ink">Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink2">Subtotal</dt>
                <dd className="font-mono text-ink tnum">{formatMoney(subtotal, currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink2">Insured shipping</dt>
                <dd className="text-[13px] text-ink3">chosen next step</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2.5">
                <dt className="font-medium text-ink">Total today</dt>
                <dd className="font-mono text-lg text-gold tnum">{formatMoney(subtotal, currency)}</dd>
              </div>
            </dl>
            <Link to="/checkout" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gold text-sm font-medium text-[#16120A] transition-all duration-100 hover:bg-gold-strong active:scale-[0.98]">
              Proceed to checkout
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-ink3">
              <Package className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Crated at the workshop, export papers handled for you, 61% settled with the maker within 14 days.
            </p>
            <button
              onClick={() => {
                clearCart();
                toast("Crate emptied");
              }}
              className="mt-4 text-[13px] text-ink3 underline-offset-2 transition-colors hover:text-danger hover:underline"
            >
              Empty the crate
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
