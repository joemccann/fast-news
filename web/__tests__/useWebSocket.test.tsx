import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      if (this.readyState === MockWebSocket.CONNECTING) {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.();
      }
    }, 0);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  send(_data: string) {
    // Mock send
  }

  // Helper to simulate receiving a message
  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  // Helper to simulate error
  simulateError() {
    this.onerror?.();
  }

  // Helper to simulate close
  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

// Store references to created WebSocket instances
let mockWebSocketInstances: MockWebSocket[] = [];

// Setup global WebSocket mock
beforeEach(() => {
  mockWebSocketInstances = [];
  (global as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      mockWebSocketInstances.push(this);
    }
  } as unknown as typeof MockWebSocket;

  // Reset timers
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('useWebSocket', () => {
  const testUrl = 'ws://localhost:3001';

  describe('initial state', () => {
    it('should start with connecting status', () => {
      const { result } = renderHook(() => useWebSocket(testUrl));
      expect(result.current.status).toBe('connecting');
    });

    it('should start with empty messages array', () => {
      const { result } = renderHook(() => useWebSocket(testUrl));
      expect(result.current.messages).toEqual([]);
    });

    it('should start with no error', () => {
      const { result } = renderHook(() => useWebSocket(testUrl));
      expect(result.current.error).toBeNull();
    });

    it('should provide reconnect function', () => {
      const { result } = renderHook(() => useWebSocket(testUrl));
      expect(typeof result.current.reconnect).toBe('function');
    });
  });

  describe('connection states', () => {
    it('should update to connected when WebSocket opens', async () => {
      const { result } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });
    });

    it('should update to disconnected when WebSocket closes', async () => {
      const { result } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      act(() => {
        mockWebSocketInstances[0].simulateClose();
      });

      expect(result.current.status).toBe('disconnected');
    });

    it('should update to error state on WebSocket error', async () => {
      const { result } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        mockWebSocketInstances[0].simulateError();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Connection error');
    });
  });

  describe('message filtering', () => {
    it('should add flash messages to state', async () => {
      const { result } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const flashMessage = {
        type: 'flash',
        headline: 'Breaking news',
        timestamp: '2024-01-15T10:30:00Z',
      };

      act(() => {
        mockWebSocketInstances[0].simulateMessage(flashMessage);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toEqual(flashMessage);
    });

    it('should add flash_impact messages to state', async () => {
      const { result } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const impactMessage = {
        type: 'flash_impact',
        headline: 'Market impact',
        timestamp: '2024-01-15T10:30:00Z',
        symbol: 'AAPL',
      };

      act(() => {
        mockWebSocketInstances[0].simulateMessage(impactMessage);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toEqual(impactMessage);
    });

    it('should filter out non-flash messages', async () => {
      const { result } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        mockWebSocketInstances[0].simulateMessage({ type: 'heartbeat' });
        mockWebSocketInstances[0].simulateMessage({ type: 'status', connected: true });
        mockWebSocketInstances[0].simulateMessage({ type: 'news', headline: 'Regular news' });
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('should accumulate multiple flash messages', async () => {
      const { result } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        mockWebSocketInstances[0].simulateMessage({ type: 'flash', headline: 'First' });
        mockWebSocketInstances[0].simulateMessage({ type: 'flash_impact', headline: 'Second' });
        mockWebSocketInstances[0].simulateMessage({ type: 'flash', headline: 'Third' });
      });

      expect(result.current.messages).toHaveLength(3);
    });

    it('should ignore invalid JSON messages', async () => {
      const { result } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      act(() => {
        // Simulate receiving invalid JSON
        mockWebSocketInstances[0].onmessage?.({ data: 'not valid json' });
      });

      expect(result.current.messages).toHaveLength(0);
    });
  });

  describe('reconnection', () => {
    it('should schedule reconnect on close', async () => {
      const { result } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const initialInstance = mockWebSocketInstances[0];

      act(() => {
        initialInstance.simulateClose();
      });

      expect(result.current.status).toBe('disconnected');

      // Advance timer to trigger reconnect (initial delay is 1000ms)
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should have created a new WebSocket instance
      expect(mockWebSocketInstances.length).toBe(2);
    });

    it('should reset reconnect attempts on successful connection', async () => {
      const { result } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      // Close and reconnect
      act(() => {
        mockWebSocketInstances[0].simulateClose();
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Let new connection open
      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });
    });

    it('should allow manual reconnect', async () => {
      const { result } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const initialInstanceCount = mockWebSocketInstances.length;

      act(() => {
        result.current.reconnect();
      });

      // Should close old connection and create new one
      expect(mockWebSocketInstances.length).toBeGreaterThan(initialInstanceCount);
    });
  });

  describe('cleanup', () => {
    it('should close WebSocket on unmount', async () => {
      const { unmount } = renderHook(() => useWebSocket(testUrl));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const ws = mockWebSocketInstances[0];

      unmount();

      expect(ws.readyState).toBe(MockWebSocket.CLOSED);
    });
  });
});
