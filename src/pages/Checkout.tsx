import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, BadgeCheck, CreditCard, Landmark, Loader2, Lock, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { masks } from "@/lib/mock/data";
import { usePageMeta } from "@/lib/meta";
import { formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { cn } from "@/utils/cn";
import { Button, EmptyState, Field, Input, Stepper } from "@/components/ui/kit";
import { MaskArtwork } from "@/components/ui/MaskImage";
import { ProvenanceTimeline, type ProvStep } from "@/components/ui/ProvenanceTimeline";

const addressSchema = z.object({
  name: z.string().min(2, "Your name, as customs will read it"),
  email: z.string().email("A reachable email, please"),
  phone: z.string().min(7, "A number the courier can call"),
  line1: z.string().min(4, "Street and number"),
  city: z.string().min(2, "City"),
  postal: z.string().min(3, "Postal code"),
  country: z.string().min(2),
});
type Address = z.infer<typeof addressSchema>;

interface ShipMethod {
  id: string;
  label: string;
  eta: string;
  priceLKR: number;
  note: string;
}

const stepNames = ["Address", "Delivery", "Payment", "Review"];

export default function Checkout() {
  usePageMeta("Secure checkout");
  const currency = useApp((s) => s.currency);
  const cart = useApp((s) => s.cart);
  const clearCart = useApp((s) => s.clearCart);
  const toast = useApp((s) => s.toast);

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<Address | null>(null);
  const [ship, setShip] = useState<ShipMethod | null>(null);
  const [pay, setPay] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const items = useMemo(
    () =>
      cart
        .map((i) => ({ ...i, mask: masks.find((m) => m.slug === i.slug) }))
        .filter((i): i is typeof i & { mask: (typeof masks)[number] } => Boolean(i.mask)),
    [cart]
  );
  const subtotal = items.reduce((s, i) => s + i.mask.priceLKR * i.qty, 0);
  const weight = items.reduce((s, i) => s + i.mask.weightKg * i.qty, 0);

  const shipOptions: ShipMethod[] = useMemo(
    () => [
      { id: "island", label: "Island courier, signed for", eta: "2–3 days", priceLKR: 2800, note: "Within Sri Lanka" },
      { id: "dhl", label: "DHL Express", eta: "5–8 days", priceLKR: Math.round(14500 + weight * 4200), note: "End-to-end tracking, customs handled" },
      { id: "fedex", label: "FedEx International Priority", eta: "4–7 days", priceLKR: Math.round(13200 + weight * 3900), note: "Fastest to most addresses" },
    ],
    [weight]
  );

  const total = subtotal + (ship?.priceLKR ?? 0);

  const form = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ?? { country: "Sri Lanka" },
  });

  const payValid = pay.number.replace(/\s/g, "").length >= 15 && pay.expiry.length === 5 && pay.cvc.length >= 3 && pay.name.trim().length > 1;

  const placeOrder = () => {
    setPlacing(true);
    window.setTimeout(() => {
      setOrderId(`MM-ORD-${3400 + Math.floor(Math.random() * 500)}`);
      setPlacing(false);
      clearCart();
      toast("Order placed", { description: "The workshop has been notified and the registry updated.", kind: "success" });
    }, 1700);
  };

  /* ------------------------------ success ------------------------------ */
  if (orderId) {
    const next: ProvStep[] = [
      { label: "Order received & paid", date: "Just now", state: "done" },
      { label: "Registry check & provenance pack", state: "current", actor: "Certificate pulled, copy printed" },
      { label: "Workshop hand-over", state: "pending", actor: "The maker signs the crate card" },
      { label: "Export papers & dispatch", state: "pending" },
      { label: "Delivered — claim your digital twin", state: "pending" },
    ];
    return (
      <div className="mx-auto max-w-2xl px-4 pt-14 sm:px-6">
        <div className="edge rounded-lg bg-s1 p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full border border-gold/50 bg-gold/10">
            <BadgeCheck className="size-6 text-gold" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-[30px] text-ink">It's on its way to its tree again</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink2">
            Order <span className="font-mono text-gold tnum">{orderId}</span> is registered. The maker has been notified and
            settlement begins on their side today.
          </p>
          <div className="mx-auto mt-8 max-w-sm text-left">
            <h2 className="mb-4 text-[13px] font-semibold text-ink">What happens next</h2>
            <ProvenanceTimeline steps={next} />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/account" className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold px-4 text-sm font-medium text-[#16120A] transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]">
              Track in your account
            </Link>
            <Link to="/masks" className="inline-flex h-10 items-center rounded-lg border border-line bg-s2 px-4 text-sm font-medium text-ink transition-colors hover:bg-s3">
              Back to the collection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ empty cart guard ---------------------- */
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6">
        <EmptyState icon={ShoppingBag} title="Nothing to check out" body="Your crate is empty — the shelves, however, are not.">
          <Link to="/masks" className="inline-flex h-10 items-center rounded-lg bg-gold px-4 text-sm font-medium text-[#16120A] transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]">
            Browse the collection
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">Secure checkout</p>
      <h1 className="mt-2 font-display text-[30px] text-ink">Two minutes, handled gently</h1>
      <Stepper steps={stepNames} current={step} className="mt-7 max-w-2xl" />

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {step > 0 && !placing && (
            <button onClick={() => setStep(step - 1)} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink3 transition-colors hover:text-ink">
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to {stepNames[step - 1]}
            </button>
          )}

          {/* STEP 1 — address */}
          {step === 0 && (
            <form
              onSubmit={form.handleSubmit((data) => {
                setAddress(data);
                setStep(1);
              })}
              className="edge space-y-4 rounded-lg bg-s1 p-6"
              aria-label="Delivery address"
              noValidate
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={form.formState.errors.name?.message}>
                  <Input autoComplete="name" placeholder="Ruwin Jayasuriya" {...form.register("name")} />
                </Field>
                <Field label="Email" error={form.formState.errors.email?.message}>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone / WhatsApp" error={form.formState.errors.phone?.message}>
                  <Input autoComplete="tel" placeholder="+94 77 000 0000" {...form.register("phone")} />
                </Field>
                <Field label="Country" error={form.formState.errors.country?.message}>
                  <select
                    className="h-10 w-full rounded-lg border border-line bg-s2 px-3 text-sm text-ink outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                    {...form.register("country")}
                  >
                    {["Sri Lanka", "United States", "United Kingdom", "Germany", "Japan", "Australia", "United Arab Emirates", "Singapore"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Street address" error={form.formState.errors.line1?.message}>
                <Input autoComplete="street-address" placeholder="14 Galle Road, Apt 3" {...form.register("line1")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City" error={form.formState.errors.city?.message}>
                  <Input placeholder="Colombo" {...form.register("city")} />
                </Field>
                <Field label="Postal code" error={form.formState.errors.postal?.message}>
                  <Input placeholder="00700" {...form.register("postal")} />
                </Field>
              </div>
              <Button type="submit" size="lg" className="w-full">
                Continue to delivery
                <ArrowRight className="size-4" />
              </Button>
            </form>
          )}

          {/* STEP 2 — delivery */}
          {step === 1 && (
            <div className="space-y-3" role="radiogroup" aria-label="Delivery method">
              {shipOptions.map((opt) => {
                const on = ship?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setShip(opt)}
                    className={cn(
                      "edge flex w-full items-center justify-between gap-4 rounded-lg p-5 text-left transition-colors duration-180",
                      on ? "border-gold/50 bg-gold/10" : "bg-s1 hover:bg-s2"
                    )}
                  >
                    <span className="flex items-start gap-3.5">
                      <Truck className={cn("mt-0.5 size-5", on ? "text-gold" : "text-ink3")} aria-hidden="true" />
                      <span>
                        <span className="block text-sm font-semibold text-ink">{opt.label}</span>
                        <span className="mt-0.5 block text-[13px] text-ink3">
                          {opt.note} · <span className="font-mono tnum">{opt.eta}</span>
                        </span>
                      </span>
                    </span>
                    <span className="font-mono text-[15px] text-ink tnum">{formatMoney(opt.priceLKR, currency)}</span>
                  </button>
                );
              })}
              <Button size="lg" className="w-full" disabled={!ship} onClick={() => setStep(2)}>
                Continue to payment
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {/* STEP 3 — payment */}
          {step === 2 && (
            <div className="edge rounded-lg bg-s1 p-6" aria-label="Payment details">
              <div className="mb-5 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <CreditCard className="size-4 text-gold" aria-hidden="true" />
                  Card payment
                </p>
                <span className="inline-flex items-center gap-2 rounded-md border border-line bg-s2 px-2 py-1 font-mono text-[10px] text-ink3 tnum">
                  <Landmark className="size-3" aria-hidden="true" />
                  PAYHERE / STRIPE STUB
                </span>
              </div>
              <div className="space-y-4">
                <Field label="Name on card">
                  <Input autoComplete="cc-name" value={pay.name} onChange={(e) => setPay({ ...pay, name: e.target.value })} placeholder="R Jayasuriya" />
                </Field>
                <Field label="Card number">
                  <Input
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={pay.number}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 19);
                      setPay({ ...pay, number: digits.replace(/(.{4})/g, "$1 ").trim() });
                    }}
                    placeholder="4242 4242 4242 4242"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry">
                    <Input
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={pay.expiry}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setPay({ ...pay, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d });
                      }}
                      placeholder="08/27"
                    />
                  </Field>
                  <Field label="Security code">
                    <Input
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={pay.cvc}
                      onChange={(e) => setPay({ ...pay, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      placeholder="•••"
                    />
                  </Field>
                </div>
                <Button size="lg" className="w-full" disabled={!payValid} onClick={() => setStep(3)}>
                  Review order
                  <ArrowRight className="size-4" />
                </Button>
                <p className="flex items-start gap-1.5 text-xs leading-relaxed text-ink3">
                  <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  This is a demonstration storefront. Details stay in your browser; no charge is made and nothing is transmitted.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4 — review */}
          {step === 3 && (
            <div className="edge space-y-5 rounded-lg bg-s1 p-6" aria-label="Review order">
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink4">Deliver to</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink2">
                    {address?.name}
                    <br />
                    {address?.line1}
                    <br />
                    {address?.city} {address?.postal}, {address?.country}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink4">Carrier</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink2">
                    {ship?.label}
                    <br />
                    <span className="font-mono text-ink3 tnum">{ship?.eta}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink4">Paying with</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink2">
                    Card ···· {pay.number.replace(/\s/g, "").slice(-4)}
                    <br />
                    <span className="text-ink3">{pay.name}</span>
                  </p>
                </div>
              </div>
              <Button size="lg" className="w-full" onClick={placeOrder} disabled={placing}>
                {placing ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}
                {placing ? "Registering the order…" : `Place order — ${formatMoney(total, currency)}`}
              </Button>
              <p className="text-center text-xs text-ink3">The maker is notified the moment the order registers.</p>
            </div>
          )}
        </div>

        {/* summary rail */}
        <aside className="edge sticky top-24 rounded-lg bg-s2 p-5" aria-label="Order summary">
          <h2 className="text-sm font-semibold text-ink">In the crate</h2>
          <ul className="mt-3 divide-y divide-line">
            {items.map(({ mask, qty }) => (
              <li key={mask.slug} className="flex items-center gap-3 py-3">
                <MaskArtwork mask={mask} ratio="" className="size-12 shrink-0 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{mask.name}</span>
                  <span className="font-mono text-[11px] text-ink4 tnum">×{qty}</span>
                </span>
                <span className="font-mono text-[13px] text-ink2 tnum">{formatMoney(mask.priceLKR * qty, currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink2">Subtotal</dt>
              <dd className="font-mono text-ink tnum">{formatMoney(subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink2">Shipping</dt>
              <dd className="font-mono text-ink tnum">{ship ? formatMoney(ship.priceLKR, currency) : "—"}</dd>
            </div>
            <div className="flex justify-between pt-1.5">
              <dt className="font-medium text-ink">Total</dt>
              <dd className="font-mono text-[17px] text-gold tnum">{formatMoney(total, currency)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
