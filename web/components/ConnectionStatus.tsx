"use client";

import type { ConnectionStatus as Status } from "@/types/news";

interface ConnectionStatusProps {
  status: Status;
  onReconnect?: () => void;
}

const statusConfig: Record<Status, { color: string; label: string }> = {
  connected: { color: "bg-green-500", label: "Connected" },
  connecting: { color: "bg-yellow-500", label: "Connecting" },
  disconnected: { color: "bg-red-500", label: "Disconnected" },
  error: { color: "bg-red-500", label: "Error" },
};

export function ConnectionStatus({ status, onReconnect }: ConnectionStatusProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${config.color} ${
            status === "connecting" ? "animate-pulse" : ""
          }`}
        />
        <span className="text-sm text-zinc-400">{config.label}</span>
      </div>
      {(status === "disconnected" || status === "error") && onReconnect && (
        <button
          onClick={onReconnect}
          className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
