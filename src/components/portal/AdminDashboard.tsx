import {
  Boxes,
  Check,
  DollarSign,
  RefreshCw,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/mock/api";
import type { Artisan, Mask, Order } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { useApp } from "@/store/app";
import { useAuth } from "@/store/auth";
import { cn } from "@/utils/cn";
import { BorderBeam } from "@/components/ui/surfaces";

export function AdminDashboard() {
  const [tab, setTab] = useState<"orders" | "catalog" | "artisans" | "settlement">("orders");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [masks, setMasks] = useState<Mask[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const toast = useApp((s) => s.toast);
  const currency = useApp((s) => s.currency);
  const user = useAuth((s) => s.user);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderList, maskList, artisanList] = await Promise.all([
        api.listOrders().catch(() => []),
        api.listMasks().catch(() => []),
        api.listArtisans().catch(() => []),
      ]);
      setOrders(orderList);
      setMasks(maskList);
      setArtisans(artisanList);
    } catch {
      toast("Error loading platform data", { kind: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    setUpdatingOrderId(orderId);
    try {
      const ok = await api.updateOrderStatus(orderId, newStatus);
      if (ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: newStatus,
                }
              : o
          )
        );
        toast(`Order ${orderId} updated to ${newStatus}`, { kind: "success" });
      }
    } catch {
      toast("Failed to update order status", { kind: "error" });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Compute platform metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalLKR || 0), 0);
  const artisanPool = Math.round(totalRevenue * 0.61);
  const reforestationPool = Math.round(totalRevenue * 0.19);
  const guildPool = Math.round(totalRevenue * 0.12);
  const platformOpsPool = Math.round(totalRevenue * 0.08);

  return (
    <div className="mt-8 space-y-8">
      {/* Platform Executive Header Banner */}
      <div className="edge relative overflow-hidden rounded-lg bg-s1 p-6">
        <BorderBeam duration={16} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium text-gold">
              <ShieldCheck className="size-3.5" />
              Platform Curator Control Tower
            </div>
            <h2 className="mt-2 font-display text-2xl text-ink">Ecosystem Governance &amp; Moderation</h2>
            <p className="mt-1 text-xs text-ink3">
              Direct oversight of orders, catalog submissions, artisan verification, and 4-way fair-trade settlement.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="font-mono text-[11px] text-ink3">Authenticated Administrator:</span>
              <span className="rounded bg-gold/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-gold">
                {user?.email || "kushanherath59@gmail.com"}
              </span>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-s2 px-3 py-1.5 text-xs text-ink hover:bg-s3"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin text-gold")} />
            Sync Ledger
          </button>
        </div>

        {/* 4-Way Fair-Trade Economic Split Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-gold/30 bg-gold/[0.06] p-4">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-gold">
              Artisan Guild (61%)
            </span>
            <p className="mt-1 font-mono text-xl font-bold text-ink">{formatMoney(artisanPool, currency)}</p>
            <span className="mt-0.5 block text-[10px] text-ink3">Disbursed directly to makers</span>
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-emerald-400">
              Reforestation (19%)
            </span>
            <p className="mt-1 font-mono text-xl font-bold text-ink">{formatMoney(reforestationPool, currency)}</p>
            <span className="mt-0.5 block text-[10px] text-ink3">Kaduru sanctuary planting</span>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/[0.06] p-4">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-blue-400">
              Apprenticeship (12%)
            </span>
            <p className="mt-1 font-mono text-xl font-bold text-ink">{formatMoney(guildPool, currency)}</p>
            <span className="mt-0.5 block text-[10px] text-ink3">Youth carver tooling stipends</span>
          </div>

          <div className="rounded-lg border border-line bg-s2 p-4">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-ink3">
              Platform Ops (8%)
            </span>
            <p className="mt-1 font-mono text-xl font-bold text-ink">{formatMoney(platformOpsPool, currency)}</p>
            <span className="mt-0.5 block text-[10px] text-ink3">AWS compute, IPFS, 3D AI</span>
          </div>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex border-b border-line">
        <button
          onClick={() => setTab("orders")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
            tab === "orders" ? "border-gold text-gold" : "border-transparent text-ink3 hover:text-ink"
          )}
        >
          <Truck className="size-4" />
          Order Dispatch ({orders.length})
        </button>
        <button
          onClick={() => setTab("catalog")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
            tab === "catalog" ? "border-gold text-gold" : "border-transparent text-ink3 hover:text-ink"
          )}
        >
          <Boxes className="size-4" />
          Catalog Curation ({masks.length})
        </button>
        <button
          onClick={() => setTab("artisans")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
            tab === "artisans" ? "border-gold text-gold" : "border-transparent text-ink3 hover:text-ink"
          )}
        >
          <Users className="size-4" />
          Artisan Guild ({artisans.length})
        </button>
        <button
          onClick={() => setTab("settlement")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
            tab === "settlement" ? "border-gold text-gold" : "border-transparent text-ink3 hover:text-ink"
          )}
        >
          <DollarSign className="size-4" />
          Settlement Ledger
        </button>
      </div>

      {/* Tab 1: Orders Dispatch Desk */}
      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base text-ink">Customer Orders &amp; Courier Fulfillment</h3>
            <span className="text-xs text-ink3">Live records from order-service &amp; RabbitMQ</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-line bg-s1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-s2/80 text-[11px] font-medium text-ink3">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Placed At</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total (LKR)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-s2/40">
                    <td className="px-4 py-3 font-mono font-medium text-gold">{o.id}</td>
                    <td className="px-4 py-3 text-ink2">
                      {o.placedAt ? new Date(o.placedAt).toLocaleDateString() : "Recent"}
                    </td>
                    <td className="px-4 py-3">
                      {o.items?.map((item, idx) => (
                        <span key={idx} className="block text-ink2">
                          {item.slug} × {item.qty}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-ink">
                      {formatMoney(o.totalLKR || 0, currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          o.status === "delivered" && "bg-emerald-500/15 text-emerald-400",
                          o.status === "in-transit" && "bg-blue-500/15 text-blue-400",
                          o.status === "preparing" && "bg-amber-500/15 text-amber-400"
                        )}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        {o.status === "preparing" && (
                          <button
                            disabled={updatingOrderId === o.id}
                            onClick={() => handleUpdateOrderStatus(o.id, "in-transit")}
                            className="rounded border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 hover:bg-blue-500/20"
                          >
                            Mark In Transit
                          </button>
                        )}
                        {o.status === "in-transit" && (
                          <button
                            disabled={updatingOrderId === o.id}
                            onClick={() => handleUpdateOrderStatus(o.id, "delivered")}
                            className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {o.status === "delivered" && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <Check className="size-3" /> Fulfilled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Catalog Curation */}
      {tab === "catalog" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base text-ink">Catalog Curation &amp; Provenance Links</h3>
            <span className="text-xs text-ink3">{masks.length} registered Kaduru masks</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-line bg-s1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-s2/80 text-[11px] font-medium text-ink3">
                <tr>
                  <th className="px-4 py-3">Mask</th>
                  <th className="px-4 py-3">Tradition</th>
                  <th className="px-4 py-3">Artisan</th>
                  <th className="px-4 py-3">Retail Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Digital Certificate</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {masks.map((m) => (
                  <tr key={m.slug} className="transition-colors hover:bg-s2/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.image}
                          alt={m.name}
                          className="size-9 rounded object-cover"
                        />
                        <div>
                          <span className="font-medium text-ink">{m.name}</span>
                          {m.featured && (
                            <span className="ml-2 rounded bg-gold/20 px-1.5 py-0.5 text-[9px] font-semibold text-gold">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 uppercase tracking-wider text-ink3">{m.tradition}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink2">{m.artisanSlug}</td>
                    <td className="px-4 py-3 font-mono font-medium text-ink">
                      {formatMoney(m.priceLKR, currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          (m.stock ?? 0) > 0
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-s3 text-ink3"
                        )}
                      >
                        {(m.stock ?? 0) > 0 ? `${m.stock} In Stock` : "Made to Order"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gold">
                      {m.certId ? (
                        <Link to={`/verify/${m.certId}`} className="hover:underline">
                          {m.certId}
                        </Link>
                      ) : (
                        <span className="text-ink3">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/masks/${m.slug}`}
                        className="rounded border border-line bg-s2 px-2.5 py-1 text-[11px] text-ink hover:bg-s3"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Artisan Guild Directory */}
      {tab === "artisans" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artisans.map((a) => (
            <div key={a.slug} className="edge rounded-lg bg-s1 p-5">
              <div className="flex items-center gap-3">
                <img
                  src={a.photo || "/images/artisans/wijesuriya.jpg"}
                  alt={a.name}
                  className="size-12 rounded-full object-cover border border-gold/40"
                />
                <div>
                  <h4 className="font-display text-base text-ink">{a.name}</h4>
                  <span className="text-xs text-ink3">{a.village || a.region}</span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink2">{a.role}</p>

              <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-xs">
                <span className="text-ink3">{new Date().getFullYear() - (a.since || 2000)} Years Mastery</span>
                <span className="flex items-center gap-1 font-medium text-emerald-400">
                  <ShieldCheck className="size-3.5 text-gold" /> Verified Maker
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Settlement Ledger */}
      {tab === "settlement" && (
        <div className="edge rounded-lg bg-s1 p-6 space-y-4">
          <h3 className="font-display text-lg text-ink">Smart Contract Fair-Trade Rules</h3>
          <p className="text-xs leading-relaxed text-ink2">
            The Mask &amp; Maker escrow smart contract divides gross marketplace payments automatically.
            Every payment splits directly upon confirmed delivery.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-s2 p-4">
              <h4 className="font-medium text-gold">Primary Sale Breakdown</h4>
              <ul className="mt-2 space-y-1.5 text-xs text-ink2">
                <li>• <strong>61%</strong> directly to the master carving workshop</li>
                <li>• <strong>19%</strong> to the Kaduru Reforestation Project in Bentota</li>
                <li>• <strong>12%</strong> to the Ambalangoda Traditional Carvers Guild</li>
                <li>• <strong>8%</strong> to platform operational costs &amp; IPFS pinning</li>
              </ul>
            </div>
            <div className="rounded-lg border border-line bg-s2 p-4">
              <h4 className="font-medium text-gold">Secondary Collector Royalties</h4>
              <ul className="mt-2 space-y-1.5 text-xs text-ink2">
                <li>• <strong>7.5%</strong> perpetual royalty to original artisan on resales</li>
                <li>• <strong>2.5%</strong> to the Guild Apprenticeship Fund</li>
                <li>• Polygon smart contract triggers instantaneous wallet payout</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
