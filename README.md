# Fast News

Real-time financial news viewer with WebSocket relay architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FAST NEWS ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │  Upstream News  │
    │     Feed        │
    │  (External)     │
    └────────┬────────┘
             │
             │ WebSocket (all message types)
             ▼
    ┌─────────────────┐
    │  Relay Server   │◄──── Filters for:
    │    /server      │      • type: "flash"
    │   (Railway)     │      • type: "flash_impact"
    │                 │
    │  Port 3001      │
    │  /health        │
    └────────┬────────┘
             │
             │ WebSocket (filtered messages only)
             ▼
    ┌─────────────────┐
    │   Web Client    │◄──── Features:
    │     /web        │      • Auto-reconnect with backoff
    │   (Vercel)      │      • Connection status indicator
    │                 │      • Real-time news feed
    │  Next.js 14     │      • Dark theme UI
    └─────────────────┘
```

## Prerequisites

- Node.js >= 18.0.0
- npm

## Local Development

### 1. Start the Relay Server

```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env and set UPSTREAM_WS_URL

npm run dev
```

The server runs on `http://localhost:3001` with health check at `/health`.

### 2. Start the Web Client

```bash
cd web
npm install
npm run dev
```

The web app runs on `http://localhost:3000` and connects to the relay server.

## Environment Variables

### Server (`/server/.env`)

```bash
# REQUIRED: Upstream WebSocket URL
UPSTREAM_WS_URL=wss://your-news-feed.com/ws

# OPTIONAL: Server configuration
PORT=3001
HEARTBEAT_INTERVAL_MS=30000
RECONNECT_DELAY_MS=5000
```

### Web (`/web/.env.local`)

```bash
# WebSocket relay server URL
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Deployment

### Deploy Server to Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Set the root directory to `server`
4. Add environment variable:
   - `UPSTREAM_WS_URL` = your upstream news feed WebSocket URL
5. Railway will auto-detect Node.js and deploy

The server includes:
- `railway.toml` with health check configuration
- `Dockerfile` for containerized deployment
- Automatic restart on failure

### Deploy Web to Vercel

1. Create a new project on [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Set the root directory to `web`
4. Add environment variable:
   - `NEXT_PUBLIC_WS_URL` = your Railway server WebSocket URL (e.g., `wss://your-app.railway.app`)
5. Deploy

## Connecting to a Real News Feed

The relay server expects an upstream WebSocket connection that sends JSON messages. It filters for messages with:

```json
{ "type": "flash", ... }
{ "type": "flash_impact", ... }
```

To connect your own feed:

1. Set `UPSTREAM_WS_URL` to your news feed WebSocket endpoint
2. Ensure your feed sends JSON messages with a `type` field
3. Messages with `type: "flash"` or `type: "flash_impact"` will be relayed to clients

### Expected Message Format

```typescript
interface NewsMessage {
  type: "flash" | "flash_impact";
  timestamp: string;
  headline?: string;
  body?: string;
  symbol?: string;
  [key: string]: unknown;
}
```

## Project Structure

```
fast-news/
├── server/                 # WebSocket relay server
│   ├── index.js           # Main server code
│   ├── package.json
│   ├── Dockerfile
│   ├── railway.toml
│   └── .env.example
│
├── web/                    # Next.js frontend
│   ├── app/
│   │   ├── page.tsx       # Main news feed page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── NewsItem.tsx
│   │   └── ConnectionStatus.tsx
│   ├── hooks/
│   │   └── useWebSocket.ts
│   ├── types/
│   │   └── news.ts
│   └── package.json
│
├── CLAUDE.md              # Claude Code guidance
└── README.md
```

## License

MIT
