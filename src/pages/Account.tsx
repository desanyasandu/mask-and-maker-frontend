import { BadgeCheck, BookUser, LogOut, Mail, MapPin, PackageOpen, ScanLine, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getCachedMask } from "@/lib/mock/api";
import { usePageMeta } from "@/lib/meta";
import type { Certificate, Mask, Order } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { useAuth } from "@/store/auth";
import { Avatar, useSignOut } from "@/components/layout/Shell";
import { AnimatedTabs, VerifiedSeal } from "@/components/ui/surfaces";
import { EmptyState, Skeleton } from "@/components/ui/kit";
import { MaskArtwork } from "@/components/ui/MaskImage";
import { ProvenanceTimeline } from "@/components/ui/ProvenanceTimeline";
import { photos } from "@/lib/photos";
import { cn } from "@/utils/cn";
import { ButtonLink } from "@/components/ui/kit";

const tabs = [
  { id: "orders", label: "Orders" },
  { id: "twins", label: "Digital twins" },
  { id: "wishlist", label: "Wishlist" },
  { id: "addresses", label: "Addresses" },
];

const orderTone: Record<Order["status"], string> = {
  delivered: "text-success",
  "in-transit": "text-gold",
  preparing: "text-warning",
};

export default function Account() {
  usePageMeta("Your account");
  const [tab, setTab] = useState("orders");
  const [orderList, setOrderList] = useState<Order[] | null>(null);
  const [masksList, setMasksList] = useState<Mask[]>([]);
  const [certList, setCertList] = useState<Certificate[]>([]);
  const wishlist = useApp((s) => s.wishlist);
  const currency = useApp((s) => s.currency);
  const user = useAuth((s) => s.user)!; // the route is wrapped in RequireAuth
  const doSignOut = useSignOut();

  useEffect(() => {
    api.listOrders().then(setOrderList).catch(() => setOrderList([]));
    api.listMasks().then(setMasksList).catch(() => {});
    api.listCertificates().then(setCertList).catch(() => {});
  }, []);

  const claimedCerts = certList.filter((c) => c.status === "claimed");
  const piecesKept = orderList ? orderList.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      {/* identity */}
      <div className="edge flex flex-wrap items-center gap-5 rounded-lg bg-s1 p-6">
        <span className="shrink-0 rounded-full border border-gold/40 p-0.5">
          <Avatar user={user} className="size-16 text-xl" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[26px] text-ink">{user.name}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink3">
            <Mail className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{user.email}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0">{user.provider === "google" ? "Signed in with Google" : "Preview account"}</span>
          </p>
          <button
            onClick={doSignOut}
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[13px] font-medium text-ink2 transition-colors hover:bg-s2 hover:text-ink"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
        <div className="flex gap-8">
          {[
            ["Pieces kept", String(piecesKept)],
            ["Twins claimed", String(claimedCerts.length)],
            ["Wishlisted", String(wishlist.length)],
          ].map(([k, v]) => (
            <div key={k} className="text-right">
              <p className="font-mono text-xl text-ink tnum">{v}</p>
              <p className="mt-0.5 text-[12.5px]  text-ink3">{k}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <AnimatedTabs id="account" tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {/* orders */}
      {tab === "orders" && (
        <div className="mt-8 space-y-4">
          {!orderList ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : (
            orderList.map((o) => (
              <section key={o.id} className="edge rounded-lg bg-s1 p-6" aria-label={`Order ${o.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <PackageOpen className="size-4 text-gold" aria-hidden="true" />
                    <span className="font-mono text-sm font-medium text-ink tnum">{o.id}</span>
                    <span className="text-xs text-ink3">{formatDate(o.placedAt)}</span>
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", orderTone[o.status])}>
                    <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                    {o.status === "delivered" ? "Delivered" : o.status === "in-transit" ? "In transit" : "Preparing at workshop"}
                  </span>
                </div>
                <div className="grid gap-6 pt-5 lg:grid-cols-2">
                  <ul className="space-y-3">
                    {o.items.map((i) => {
                      const m = masksList.find((x) => x.slug === i.slug) ?? getCachedMask(i.slug);
                      if (!m) return null;
                      return (
                        <li key={i.slug} className="flex items-center gap-3">
                          <MaskArtwork mask={m} ratio="" className="size-12 shrink-0 rounded-lg" />
                          <div className="min-w-0 flex-1">
                            <Link to={`/masks/${m.slug}`} className="block truncate text-sm font-medium text-ink hover:text-gold-strong">
                              {m.name}
                            </Link>
                            <p className="font-mono text-[11px] text-ink3 tnum">×{i.qty}</p>
                          </div>
                          <span className="font-mono text-[13px] text-ink2 tnum">{formatMoney(i.priceLKR * i.qty, currency)}</span>
                        </li>
                      );
                    })}
                    <li className="flex justify-between border-t border-line pt-3 text-sm">
                      <span className="text-ink3">Total incl. shipping</span>
                      <span className="font-mono text-ink tnum">{formatMoney(o.totalLKR, currency)}</span>
                    </li>
                  </ul>
                  <ProvenanceTimeline steps={o.events.map((e, i, arr) => ({ label: e.label, date: e.date, state: e.done ? "done" : arr.slice(0, i).every((x) => x.done) ? "current" : "pending" }))} />
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* digital twins */}
      {tab === "twins" && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {claimedCerts.map((c) => {
              const m = masksList.find((x) => x.slug === c.maskSlug) ?? getCachedMask(c.maskSlug);
              if (!m) return null;
              return (
                <div key={c.id} className="edge flex gap-5 rounded-lg bg-s1 p-5">
                  <MaskArtwork mask={m} ratio="" className="size-24 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <Link to={`/masks/${m.slug}`} className="truncate font-display text-[17px] text-ink hover:text-gold-strong">{m.name}</Link>
                      <VerifiedSeal size="sm" label={null} />
                    </div>
                    <p className="mt-1 font-mono text-[12px] text-gold tnum">{c.id}</p>
                    <p className="mt-1 text-xs text-ink3">Minted {formatDate(c.mintedAt)} · {c.chain} registry</p>
                    <Link to={`/verify/${c.id}`} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-gold hover:text-gold-strong">
                      <ScanLine className="size-3.5" aria-hidden="true" />
                      Open certificate
                    </Link>
                  </div>
                </div>
              );
            })}
          <div className="flex flex-col items-start justify-center gap-1 rounded-lg bg-s1 p-5">
            <p className="text-sm font-medium text-ink">Scanned a tag on a piece you own?</p>
            <p className="mt-1 text-sm leading-relaxed text-ink2">Claim its twin here and the certificate starts answering to your name.</p>
            <Link to="/verify" className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-gold px-3.5 text-[13px] font-medium text-on-gold transition-transform duration-100 hover:bg-gold-strong active:scale-[0.98]">
              <BadgeCheck className="size-4" aria-hidden="true" />
              Verify & claim
            </Link>
          </div>
        </div>
      )}

      {/* wishlist */}
      {tab === "wishlist" &&
        (wishlist.length === 0 ? (
          <div className="mt-8">
            <EmptyState photo={photos.masksWall2} title="Nothing kept yet" body="Tap the heart on any mask and it waits here — privately, on this device.">
              <ButtonLink to="/masks">Browse the collection</ButtonLink>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist
              .map((slug) => masksList.find((m) => m.slug === slug) ?? getCachedMask(slug))
              .filter((m): m is Mask => Boolean(m))
              .map((m) => (
                <div key={m.slug} className="edge relative flex items-center gap-4 rounded-lg bg-s1 p-4">
                  <MaskArtwork mask={m} ratio="" className="size-16 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/masks/${m.slug}`} className="truncate text-sm font-medium text-ink hover:text-gold-strong">{m.name}</Link>
                    <p className="mt-0.5 font-mono text-[13px] text-ink2 tnum">{formatMoney(m.priceLKR, currency)}</p>
                  </div>
                  <WishlistRemove slug={m.slug} name={m.name} />
                </div>
              ))}
          </div>
        ))}

      {/* addresses */}
      {tab === "addresses" && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { label: "Home", name: "Ruwin Jayasuriya", lines: ["14/2 Galle Road, Apt 3", "Colombo 00700, Sri Lanka"] },
            { label: "Office", name: "R. Jayasuriya", lines: ["Level 4, Trace City", "Maradana, Colombo 01000"] },
          ].map((a) => (
            <div key={a.label} className="edge rounded-lg bg-s1 p-5">
              <p className="flex items-center gap-2 text-[12.5px] font-medium  text-ink3">
                <BookUser className="size-3.5 text-gold" aria-hidden="true" />
                {a.label}
              </p>
              <p className="mt-3 text-sm font-medium text-ink">{a.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink2">
                {a.lines[0]}
                <br />
                {a.lines[1]}
              </p>
            </div>
          ))}
          <AddAddressButton />
        </div>
      )}
    </div>
  );
}

function WishlistRemove({ slug, name }: { slug: string; name: string }) {
  const toggle = useApp((s) => s.toggleWishlist);
  const toast = useApp((s) => s.toast);
  return (
    <button
      onClick={() => {
        toggle(slug);
        toast("Removed from wishlist", { description: name });
      }}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-ink3 transition-colors hover:bg-s2 hover:text-danger"
      aria-label={`Remove ${name} from wishlist`}
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function AddAddressButton() {
  const toast = useApp((s) => s.toast);
  return (
    <button
      onClick={() => toast("Address book opens at full launch", { description: "Checkout collects addresses one at a time for now." })}
      className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-canvas text-ink3 transition-colors hover:border-gold/40 hover:text-ink2"
    >
      <MapPin className="size-5" aria-hidden="true" />
      <span className="text-sm font-medium">Add an address</span>
    </button>
  );
}
