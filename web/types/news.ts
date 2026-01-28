export type MessageType = "flash" | "flash_impact";

export interface NewsMessage {
  type: MessageType;
  timestamp: string;
  headline?: string;
  body?: string;
  symbol?: string;
  [key: string]: unknown;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
