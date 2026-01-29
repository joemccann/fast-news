"use client";

import { useEffect, useState } from "react";
import type { MergedNewsItem, FlashImpact } from "@/types/news";

interface NewsItemProps {
  item: MergedNewsItem;
  isNew?: boolean;
}

function ImpactBadge({ impact, isNew }: { impact: FlashImpact; isNew: boolean }) {
  const isBullish = impact.impact === "bullish";
  const isBearish = impact.impact === "bearish";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
        ${isBullish ? "bg-emerald-500/15 text-emerald-400" : ""}
        ${isBearish ? "bg-red-500/15 text-red-400" : ""}
        ${!isBullish && !isBearish ? "bg-zinc-500/15 text-zinc-400" : ""}
        ${isNew ? "impact-badge-new" : ""}`}
    >
      {isBullish && (
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
          />
        </svg>
      )}
      {isBearish && (
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
          />
        </svg>
      )}
      <span className="font-mono">{impact.symbol.replace(".O", "")}</span>
    </span>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function stripHtml(html: string): string {
  // Remove HTML tags but preserve the text
  return html.replace(/<[^>]*>/g, "");
}

export function NewsItem({ item, isNew = false }: NewsItemProps) {
  const [shouldAnimate, setShouldAnimate] = useState(isNew);
  const hasImpacts = item.impacts.length > 0;
  const cleanContent = stripHtml(item.content);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setShouldAnimate(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <article
      className={`relative px-4 py-3 rounded-lg border border-zinc-800/50
        bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors duration-150
        ${shouldAnimate ? "news-item-enter news-item-flash" : ""}
        ${item.important ? "border-l-2 border-l-amber-500/70" : ""}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {hasImpacts &&
            item.impacts.map((impact) => (
              <ImpactBadge
                key={impact.symbol}
                impact={impact}
                isNew={shouldAnimate}
              />
            ))}
        </div>
        <time
          className="text-xs text-zinc-500 tabular-nums whitespace-nowrap font-mono"
          dateTime={item.time}
        >
          {formatTime(item.time)}
        </time>
      </div>

      {/* Content */}
      <p className="text-sm text-zinc-200 leading-relaxed font-medium">
        {cleanContent}
      </p>

      {/* Images if present */}
      {item.pics.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {item.pics.map((pic, idx) => (
            <div key={idx} className="relative h-16 w-24 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pic}
                alt=""
                className="h-16 w-auto rounded border border-zinc-800 object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
