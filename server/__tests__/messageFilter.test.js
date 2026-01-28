/**
 * Unit tests for message filtering logic
 * The server should only pass through "flash" and "flash_impact" message types
 */

describe('Message Filtering Logic', () => {
  // Extracted filter function that mirrors server behavior
  const shouldBroadcast = (message) => {
    return message.type === 'flash' || message.type === 'flash_impact';
  };

  describe('shouldBroadcast', () => {
    it('should pass through flash messages', () => {
      const message = {
        type: 'flash',
        headline: 'Breaking news',
        timestamp: '2024-01-15T10:30:00Z',
      };
      expect(shouldBroadcast(message)).toBe(true);
    });

    it('should pass through flash_impact messages', () => {
      const message = {
        type: 'flash_impact',
        headline: 'Market impact alert',
        timestamp: '2024-01-15T10:30:00Z',
        symbol: 'AAPL',
      };
      expect(shouldBroadcast(message)).toBe(true);
    });

    it('should filter out heartbeat messages', () => {
      const message = { type: 'heartbeat' };
      expect(shouldBroadcast(message)).toBe(false);
    });

    it('should filter out status messages', () => {
      const message = { type: 'status', connected: true };
      expect(shouldBroadcast(message)).toBe(false);
    });

    it('should filter out generic news messages', () => {
      const message = {
        type: 'news',
        headline: 'Regular news article',
      };
      expect(shouldBroadcast(message)).toBe(false);
    });

    it('should filter out messages with undefined type', () => {
      const message = { headline: 'No type field' };
      expect(shouldBroadcast(message)).toBe(false);
    });

    it('should filter out messages with null type', () => {
      const message = { type: null, headline: 'Null type' };
      expect(shouldBroadcast(message)).toBe(false);
    });

    it('should filter out messages with similar but incorrect types', () => {
      expect(shouldBroadcast({ type: 'Flash' })).toBe(false); // Case sensitive
      expect(shouldBroadcast({ type: 'FLASH' })).toBe(false);
      expect(shouldBroadcast({ type: 'flash_' })).toBe(false);
      expect(shouldBroadcast({ type: 'flashimpact' })).toBe(false);
      expect(shouldBroadcast({ type: 'flash-impact' })).toBe(false);
    });

    it('should handle messages with additional fields', () => {
      const flashWithExtras = {
        type: 'flash',
        headline: 'Breaking news',
        body: 'Full story here',
        symbol: 'TSLA',
        source: 'Reuters',
        priority: 1,
      };
      expect(shouldBroadcast(flashWithExtras)).toBe(true);
    });
  });
});
