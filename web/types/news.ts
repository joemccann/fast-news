export type MessageType = "flash" | "flash_impact";

export interface FlashImpact {
  symbol: string;
  impact: "bullish" | "bearish" | "neutral";
}

export interface FlashRemark {
  content: string;
  id: number;
  pics: string[];
  title: string;
  type: string;
  vip_level: number;
}

export interface FlashData {
  a_shares: string[];
  action: number;
  category: number[];
  data: {
    content: string;
    pic: string;
    title: string;
  };
  id: string;
  important: number;
  remark: FlashRemark[];
  time: string;
  type: number;
  mid: string;
}

export interface FlashMessage {
  type: "flash";
  data: FlashData;
}

export interface FlashImpactMessage {
  type: "flash_impact";
  data: {
    id: string;
    impact: FlashImpact[];
  };
}

export type NewsMessage = FlashMessage | FlashImpactMessage;

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

// Merged news item for display (flash + optional impact data)
export interface MergedNewsItem {
  id: string;
  content: string;
  time: string;
  important: boolean;
  pics: string[];
  impacts: FlashImpact[];
  receivedAt: number;
}
