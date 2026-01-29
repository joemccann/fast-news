"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { NewsItem } from "@/components/NewsItem";
import { useEffect, useRef, useState } from "react";

export const dynamic = "force-dynamic";

export default function Home() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
  const { status, items, reconnect, clearMessages } = useWebSocket(wsUrl);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const prevItemCountRef = useRef(0);

  // Track new items for animation
  useEffect(() => {
    if (items.length > prevItemCountRef.current) {
      const newIds = new Set(
        items.slice(0, items.length - prevItemCountRef.current).map((i) => i.id)
      );
      setNewItemIds(newIds);

      // Clear "new" status after animation
      const timer = setTimeout(() => setNewItemIds(new Set()), 2500);
      return () => clearTimeout(timer);
    }
    prevItemCountRef.current = items.length;
  }, [items]);

  return (
    <main className="min-h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-zinc-100 tracking-tight">
              Fast News
            </h1>
            <span className="text-xs text-zinc-600 font-mono hidden sm:inline">
              {items.length > 0 && `${items.length} items`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={clearMessages}
                className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1
                           transition-colors duration-150 cursor-pointer"
              >
                Clear
              </button>
            )}
            <ConnectionStatus status={status} onReconnect={reconnect} />
          </div>
        </div>
      </header>

      {/* News Feed */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                <svg
                  className={`w-6 h-6 text-zinc-600 ${
                    status === "connecting" ? "connection-pulse" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
                  />
                </svg>
              </div>
              <p className="text-sm text-zinc-500 mb-1">
                {status === "connected"
                  ? "Waiting for flash news..."
                  : status === "connecting"
                    ? "Connecting to feed..."
                    : "Feed disconnected"}
              </p>
              <p className="text-xs text-zinc-600">
                Real-time financial news will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <NewsItem
                  key={item.id}
                  item={item}
                  isNew={newItemIds.has(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
