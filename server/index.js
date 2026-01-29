import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const UPSTREAM_WS_URL = process.env.UPSTREAM_WS_URL;
const HEARTBEAT_INTERVAL_MS = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '30000', 10);
const RECONNECT_DELAY_MS = parseInt(process.env.RECONNECT_DELAY_MS || '5000', 10);

if (!UPSTREAM_WS_URL) {
  console.error('[ERROR] UPSTREAM_WS_URL environment variable is required');
  process.exit(1);
}

// Track client connections with heartbeat state
const clients = new Map();

// Upstream connection state
let upstreamWs = null;
let upstreamReconnectTimeout = null;
let isShuttingDown = false;

// ============================================================================
// HTTP Server with Health Check
// ============================================================================

const httpServer = createServer((req, res) => {
  // CORS headers for all responses
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
      upstreamConnected: upstreamWs?.readyState === WebSocket.OPEN,
      clientCount: clients.size,
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// ============================================================================
// WebSocket Server for Browser Clients
// ============================================================================

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  const clientId = `${req.socket.remoteAddress}:${Date.now()}`;
  clients.set(ws, { id: clientId, isAlive: true });

  console.log(`[CLIENT] Connected: ${clientId} (total: ${clients.size})`);

  // Handle pong responses for heartbeat
  ws.on('pong', () => {
    const client = clients.get(ws);
    if (client) {
      client.isAlive = true;
    }
  });

  ws.on('close', () => {
    console.log(`[CLIENT] Disconnected: ${clientId} (total: ${clients.size - 1})`);
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error(`[CLIENT] Error for ${clientId}:`, err.message);
    clients.delete(ws);
  });

  // Send initial connection confirmation
  ws.send(JSON.stringify({
    type: 'connection',
    status: 'connected',
    upstreamConnected: upstreamWs?.readyState === WebSocket.OPEN,
  }));
});

// Heartbeat interval - ping all clients
const heartbeatInterval = setInterval(() => {
  clients.forEach((client, ws) => {
    if (!client.isAlive) {
      console.log(`[CLIENT] Terminating unresponsive client: ${client.id}`);
      clients.delete(ws);
      ws.terminate();
      return;
    }
    client.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL_MS);

// ============================================================================
// Upstream WebSocket Connection
// ============================================================================

function connectUpstream() {
  if (isShuttingDown) return;

  console.log(`[UPSTREAM] Connecting to ${UPSTREAM_WS_URL}...`);

  upstreamWs = new WebSocket(UPSTREAM_WS_URL);

  upstreamWs.on('open', () => {
    console.log('[UPSTREAM] Connected');
    // Notify all clients about upstream connection
    broadcast({
      type: 'upstream_status',
      connected: true,
    });
  });

  upstreamWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Filter for flash and flash_impact messages only
      if (message.type === 'flash' || message.type === 'flash_impact') {
        console.log(`[UPSTREAM] Received ${message.type} message, broadcasting to ${clients.size} clients`);
        broadcast(message);
      }
    } catch (err) {
      console.error('[UPSTREAM] Failed to parse message:', err.message);
    }
  });

  upstreamWs.on('close', (code, reason) => {
    console.log(`[UPSTREAM] Disconnected (code: ${code}, reason: ${reason || 'none'})`);
    upstreamWs = null;

    // Notify clients about upstream disconnection
    broadcast({
      type: 'upstream_status',
      connected: false,
    });

    // Schedule reconnection
    scheduleReconnect();
  });

  upstreamWs.on('error', (err) => {
    console.error('[UPSTREAM] Error:', err.message);
    // The 'close' event will be emitted after 'error'
  });

  // Upstream ping-pong to keep connection alive
  upstreamWs.on('ping', () => {
    upstreamWs?.pong();
  });
}

function scheduleReconnect() {
  if (isShuttingDown || upstreamReconnectTimeout) return;

  console.log(`[UPSTREAM] Reconnecting in ${RECONNECT_DELAY_MS}ms...`);
  upstreamReconnectTimeout = setTimeout(() => {
    upstreamReconnectTimeout = null;
    connectUpstream();
  }, RECONNECT_DELAY_MS);
}

// ============================================================================
// Broadcast to All Connected Clients
// ============================================================================

function broadcast(message) {
  const data = JSON.stringify(message);
  let sentCount = 0;

  clients.forEach((client, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
      sentCount++;
    }
  });

  if (sentCount > 0 && message.type !== 'upstream_status') {
    console.log(`[BROADCAST] Sent to ${sentCount} clients`);
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

function shutdown(signal) {
  console.log(`\n[SERVER] Received ${signal}, shutting down gracefully...`);
  isShuttingDown = true;

  // Clear reconnect timeout
  if (upstreamReconnectTimeout) {
    clearTimeout(upstreamReconnectTimeout);
  }

  // Stop heartbeat
  clearInterval(heartbeatInterval);

  // Close upstream connection
  if (upstreamWs) {
    upstreamWs.close(1000, 'Server shutting down');
  }

  // Close all client connections
  clients.forEach((client, ws) => {
    ws.close(1001, 'Server shutting down');
  });

  // Close WebSocket server
  wss.close(() => {
    console.log('[SERVER] WebSocket server closed');

    // Close HTTP server
    httpServer.close(() => {
      console.log('[SERVER] HTTP server closed');
      process.exit(0);
    });
  });

  // Force exit after timeout
  setTimeout(() => {
    console.error('[SERVER] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ============================================================================
// Start Server
// ============================================================================

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] WebSocket relay server listening on 0.0.0.0:${PORT}`);
  console.log(`[SERVER] Health check available at http://localhost:${PORT}/health`);
  connectUpstream();
});
