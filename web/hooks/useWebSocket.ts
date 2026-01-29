"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ConnectionStatus,
  NewsMessage,
  MergedNewsItem,
  FlashImpact,
} from "@/types/news";

const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_MESSAGES = 100;

export function useWebSocket(url: string) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [items, setItems] = useState<MergedNewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const processMessage = useCallback((msg: NewsMessage) => {
    if (!isMountedRef.current) return;

    if (msg.type === "flash") {
      const { data } = msg;
      const newItem: MergedNewsItem = {
        id: data.id,
        content: data.data.content,
        time: data.time,
        important: data.important === 1,
        pics: data.remark?.flatMap((r) => r.pics) || [],
        impacts: [],
        receivedAt: Date.now(),
      };

      setItems((prev) => {
        const updated = [newItem, ...prev];
        return updated.slice(0, MAX_MESSAGES);
      });
    } else if (msg.type === "flash_impact") {
      const { data } = msg;
      setItems((prev) =>
        prev.map((item) =>
          item.id === data.id
            ? { ...item, impacts: data.impact as FlashImpact[] }
            : item
        )
      );
    }
  }, []);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    setStatus("connecting");
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }
        setStatus("connected");
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data) as NewsMessage;
          if (data.type === "flash" || data.type === "flash_impact") {
            processMessage(data);
          }
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        setStatus("error");
        setError("Connection error");
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setStatus("disconnected");
        wsRef.current = null;
        scheduleReconnect();
      };
    } catch (err) {
      if (!isMountedRef.current) return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to connect");
      scheduleReconnect();
    }
  }, [url, processMessage]);

  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      setError("Max reconnection attempts reached");
      return;
    }

    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
      MAX_RECONNECT_DELAY
    );

    reconnectAttempts.current += 1;

    reconnectTimeout.current = setTimeout(() => {
      if (isMountedRef.current) {
        connect();
      }
    }, delay);
  }, [connect]);

  const reconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    reconnectAttempts.current = 0;
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setItems([]);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    items,
    error,
    reconnect,
    clearMessages,
  };
}
