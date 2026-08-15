"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  link: string;
  is_read: number | boolean;
  created_at: string;
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiFetch<NotificationRow[]>("/notifications/");
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // ignore fetch errors; the bell simply shows nothing
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) void load();
  };

  const handleClick = async (notification: NotificationRow) => {
    setOpen(false);
    if (!notification.is_read) {
      try {
        await apiFetch<NotificationRow>(`/notifications/${notification.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ is_read: true }),
        });
        setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: 1 } : n)));
      } catch {
        // non-fatal
      }
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors cursor-pointer"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-80 overflow-hidden rounded border border-border bg-card shadow-lg animate-fade-in">
          <div className="flex items-center justify-between border-b border-border/80 px-4 py-2.5 bg-card/60">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Notifications</span>
            <span className="text-[9px] font-mono text-muted-foreground">
              {unreadCount} unread
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="px-4 py-6 text-center text-[11px] font-medium text-muted-foreground">
                Loading notifications...
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-6 text-center text-[11px] font-medium text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleClick(notification)}
                  className={cn(
                    "block w-full text-left px-4 py-3 border-b border-border/40 last:border-b-0 hover:bg-secondary/30 transition-colors cursor-pointer",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn("text-[11px] font-bold text-foreground leading-snug", !notification.is_read && "text-primary")}>
                      {notification.title}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap shrink-0">
                      {relativeTime(notification.created_at)}
                    </span>
                  </div>
                  {notification.body && (
                    <span className="mt-0.5 block text-[10px] text-muted-foreground leading-snug">
                      {notification.body}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
