import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Coins,
  ExternalLink,
  Info,
  Package,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/mock/api";
import type { NotificationItem } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { cn } from "@/utils/cn";

function getCategoryIcon(category?: string) {
  switch (category) {
    case "minting":
      return <Sparkles className="size-4 text-gold" />;
    case "order":
      return <Package className="size-4 text-sky-400" />;
    case "verification":
      return <Check className="size-4 text-emerald-400" />;
    case "payout":
      return <Coins className="size-4 text-amber-400" />;
    case "security":
      return <ShieldAlert className="size-4 text-rose-400" />;
    default:
      return <Info className="size-4 text-ink3" />;
  }
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotificationBell() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Compute recipient IDs for current user (email, artisan slug, guild curator for admins)
  const recipientIds = user
    ? [
        user.email,
        user.name?.toLowerCase().replace(/\s+/g, "-"),
        user.email?.toLowerCase().includes("kushanherath") ? "guild_curator" : "",
        user.email?.toLowerCase().includes("kushanherath") ? "kushan-herath" : "",
      ]
        .filter(Boolean)
        .join(",")
    : "chandana-bandara";

  const fetchNotifications = async () => {
    try {
      const res = await api.listNotifications(recipientIds, 25);
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      // silently fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [recipientIds]);

  // Click outside and escape handling
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleMarkAllRead = async () => {
    setLoading(true);
    await api.markAllNotificationsAsRead(recipientIds);
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    setLoading(false);
  };

  const handleClickItem = async (item: NotificationItem) => {
    if (!item.isRead) {
      api.markNotificationAsRead(item.id);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (item.link) {
      if (item.link.startsWith("http")) {
        window.open(item.link, "_blank");
      } else {
        navigate(item.link);
      }
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.deleteNotification(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div ref={wrap} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        data-spot
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        className={cn(
          "relative grid size-11 place-items-center rounded-full border border-line text-ink2 transition-colors hover:bg-s2 hover:text-ink",
          open && "border-gold/60 text-ink"
        )}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-gold font-mono text-[10px] font-bold text-on-gold shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications panel"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 sm:w-96 origin-top-right rounded-2xl border border-line bg-canvas shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-display text-[15px] text-ink">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 font-mono text-[11px] font-medium text-gold tnum">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 text-[12px] font-medium text-ink3 hover:text-gold transition-colors"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-line/40">
              {items.length === 0 ? (
                <div className="p-8 text-center text-ink3">
                  <Bell className="mx-auto size-8 opacity-40 mb-2" />
                  <p className="text-sm font-medium text-ink">All caught up</p>
                  <p className="mt-1 text-xs text-ink3">You have no unread notifications right now.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleClickItem(item)}
                    className={cn(
                      "group relative flex items-start gap-3 p-3.5 text-left transition-colors cursor-pointer hover:bg-s2",
                      !item.isRead ? "bg-gold/[0.04]" : "opacity-80 hover:opacity-100"
                    )}
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-s1">
                      {getCategoryIcon(item.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("truncate text-[13px] font-medium text-ink", !item.isRead && "text-gold font-semibold")}>
                          {item.title}
                        </p>
                        <span className="shrink-0 font-mono text-[11px] text-ink3 tnum">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink2 line-clamp-2 leading-relaxed">{item.message}</p>
                      {item.link && (
                        <span className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] text-gold group-hover:underline">
                          View details <ExternalLink className="size-2.5" />
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteItem(e, item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-ink3 hover:text-rose-400 transition-opacity"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-line px-4 py-2 text-center text-[11px] text-ink3">
              Real-time updates via Mask &amp; Maker Notification Mesh
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
