"use client";

import type { NewsMessage } from "@/types/news";

interface NewsItemProps {
  message: NewsMessage;
}

export function NewsItem({ message }: NewsItemProps) {
  const isImpact = message.type === "flash_impact";
  const timestamp = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString()
    : new Date().toLocaleTimeString();

  return (
    <article
      className={`p-4 rounded-lg border ${
        isImpact
          ? "bg-amber-950/30 border-amber-800/50"
          : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${
              isImpact
                ? "bg-amber-600/30 text-amber-300"
                : "bg-blue-600/30 text-blue-300"
            }`}
          >
            {isImpact ? "IMPACT" : "FLASH"}
          </span>
          {message.symbol && (
            <span className="text-xs font-mono text-zinc-400">
              {message.symbol}
            </span>
          )}
        </div>
        <time className="text-xs text-zinc-500 whitespace-nowrap">
          {timestamp}
        </time>
      </div>

      {message.headline && (
        <h3 className="font-medium text-zinc-100 mb-1">{message.headline}</h3>
      )}

      {message.body && (
        <p className="text-sm text-zinc-400 leading-relaxed">{message.body}</p>
      )}

      {!message.headline && !message.body && (
        <pre className="text-sm text-zinc-400 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(message, null, 2)}
        </pre>
      )}
    </article>
  );
}
