"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { NewsItem } from "@/components/NewsItem";
import { useEffect, useRef } from "react";
export const dynamic = "force-dynamic";

export default function Home() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
  const { status, messages, reconnect } = useWebSocket(wsUrl);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold">Fast News</h1>
          <ConnectionStatus status={status} onReconnect={reconnect} />
        </div>
      </header>

      {/* News Feed */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-4xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <p className="text-lg mb-2">No news yet</p>
              <p className="text-sm">
                {status === "connected"
                  ? "Waiting for flash news..."
                  : "Connecting to news feed..."}
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <NewsItem key={`${msg.timestamp}-${index}`} message={msg} />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-zinc-900/95 border-t border-zinc-800 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-zinc-500">
          <span>{messages.length} messages</span>
          <span>Real-time financial news</span>
        </div>
      </footer>
    </main>
  );
}
