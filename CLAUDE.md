# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

fast-news is a real-time financial news viewer consisting of two components:

1. **WebSocket Relay Server** (`/server`) - Node.js server that connects to an upstream news feed, filters for flash messages, and broadcasts to browser clients
2. **Next.js Frontend** (`/web`) - React application that displays real-time flash news with auto-reconnection

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Upstream News  │      │  Relay Server   │      │   Web Client    │
│     Feed        │─────▶│   (Railway)     │─────▶│   (Vercel)      │
│                 │  WS  │                 │  WS  │                 │
│ All message     │      │ Filters for     │      │ Displays flash  │
│ types           │      │ flash +         │      │ + flash_impact  │
│                 │      │ flash_impact    │      │ messages        │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Commands

### Server (`/server`)

```bash
cd server

# Install dependencies
npm install

# Run development (with auto-reload)
npm run dev

# Run production
npm start
```

### Web (`/web`)

```bash
cd web

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint
npm run lint
```

## Environment Variables

### Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `UPSTREAM_WS_URL` | Yes | - | WebSocket URL of the upstream news feed |
| `PORT` | No | 3001 | Server port |
| `HEARTBEAT_INTERVAL_MS` | No | 30000 | Client heartbeat interval |
| `RECONNECT_DELAY_MS` | No | 5000 | Upstream reconnection delay |

### Web

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_WS_URL` | No | ws://localhost:3001 | WebSocket relay server URL |

## Key Files

### Server
- `server/index.js` - Main relay server with upstream connection, client management, health endpoint
- `server/Dockerfile` - Multi-stage Docker build for Railway
- `server/railway.toml` - Railway deployment configuration

### Web
- `web/app/page.tsx` - Main page with news feed display
- `web/hooks/useWebSocket.ts` - WebSocket hook with exponential backoff reconnection
- `web/components/NewsItem.tsx` - Individual news message component
- `web/components/ConnectionStatus.tsx` - Connection indicator with retry button
- `web/types/news.ts` - TypeScript types for messages and status

## Deployment

### Server (Railway)
1. Connect GitHub repo to Railway
2. Set root directory to `/server`
3. Configure `UPSTREAM_WS_URL` environment variable
4. Railway auto-deploys on push to main

### Web (Vercel)
1. Connect GitHub repo to Vercel
2. Set root directory to `/web`
3. Configure `NEXT_PUBLIC_WS_URL` to point to Railway server
4. Vercel auto-deploys on push to main
