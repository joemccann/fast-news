"use client";

import type { ConnectionStatus as Status } from "@/types/news";

interface ConnectionStatusProps {
  status: Status;
  onReconnect?: () => void;
}

const statusConfig: Record<
  Status,
  { color: string; bgColor: string; label: string }
> = {
  connected: {
    color: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    label: "Live",
  },
  connecting: {
    color: "bg-amber-500",
    bgColor: "bg-amber-500/10",
    label: "Connecting",
  },
  disconnected: {
    color: "bg-zinc-500",
    bgColor: "bg-zinc-500/10",
    label: "Offline",
  },
  error: {
    color: "bg-red-500",
    bgColor: "bg-red-500/10",
    label: "Error",
  },
};

export function ConnectionStatus({ status, onReconnect }: ConnectionStatusProps) {
  const config = statusConfig[status];
  const showRetry = (status === "disconnected" || status === "error") && onReconnect;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full ${config.bgColor}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.color} ${
            status === "connecting" ? "connection-pulse" : ""
          } ${status === "connected" ? "shadow-[0_0_6px_rgb(16_185_129_/_0.5)]" : ""}`}
        />
        <span className="text-xs font-medium text-zinc-300 tracking-wide">
          {config.label}
        </span>
      </div>

      {showRetry && (
        <button
          onClick={onReconnect}
          className="text-xs font-medium px-3 py-1 text-zinc-400 hover:text-zinc-200
                     bg-zinc-800/50 hover:bg-zinc-800 rounded-full
                     transition-colors duration-150 cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
}
