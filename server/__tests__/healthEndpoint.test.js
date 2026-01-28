/**
 * Tests for the health endpoint
 * GET /health should return server status information
 */

import { createServer } from 'http';
import { WebSocket } from 'ws';

describe('Health Endpoint', () => {
  let httpServer;
  let serverPort;
  let clients;
  let upstreamWs;

  // Mock the health handler logic (extracted from server)
  const createHealthHandler = (getUpstreamState, getClients) => (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        upstreamConnected: getUpstreamState()?.readyState === WebSocket.OPEN,
        clientCount: getClients().size,
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  };

  beforeEach((done) => {
    clients = new Map();
    upstreamWs = null;

    httpServer = createServer(
      createHealthHandler(
        () => upstreamWs,
        () => clients
      )
    );

    httpServer.listen(0, () => {
      serverPort = httpServer.address().port;
      done();
    });
  });

  afterEach((done) => {
    httpServer.close(done);
  });

  const fetchHealth = async () => {
    const response = await fetch(`http://localhost:${serverPort}/health`);
    return {
      status: response.status,
      data: await response.json(),
    };
  };

  it('should return 200 status for health endpoint', async () => {
    const { status } = await fetchHealth();
    expect(status).toBe(200);
  });

  it('should return status field as "ok"', async () => {
    const { data } = await fetchHealth();
    expect(data.status).toBe('ok');
  });

  it('should return a valid ISO timestamp', async () => {
    const { data } = await fetchHealth();
    expect(data.timestamp).toBeDefined();
    const timestamp = new Date(data.timestamp);
    expect(timestamp.toISOString()).toBe(data.timestamp);
    // Timestamp should be recent (within last 5 seconds)
    expect(Date.now() - timestamp.getTime()).toBeLessThan(5000);
  });

  it('should return upstreamConnected as false when not connected', async () => {
    const { data } = await fetchHealth();
    expect(data.upstreamConnected).toBe(false);
  });

  it('should return upstreamConnected as true when connected', async () => {
    // Simulate connected upstream
    upstreamWs = { readyState: WebSocket.OPEN };
    const { data } = await fetchHealth();
    expect(data.upstreamConnected).toBe(true);
  });

  it('should return correct clientCount with no clients', async () => {
    const { data } = await fetchHealth();
    expect(data.clientCount).toBe(0);
  });

  it('should return correct clientCount with multiple clients', async () => {
    // Simulate connected clients
    clients.set('client1', { id: 'client1', isAlive: true });
    clients.set('client2', { id: 'client2', isAlive: true });
    clients.set('client3', { id: 'client3', isAlive: true });

    const { data } = await fetchHealth();
    expect(data.clientCount).toBe(3);
  });

  it('should include CORS headers in response', async () => {
    const response = await fetch(`http://localhost:${serverPort}/health`);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await fetch(`http://localhost:${serverPort}/unknown`);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Not found');
  });

  it('should handle OPTIONS preflight request', async () => {
    const response = await fetch(`http://localhost:${serverPort}/health`, {
      method: 'OPTIONS',
    });
    expect(response.status).toBe(204);
  });
});
