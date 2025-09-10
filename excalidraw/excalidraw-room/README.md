# Excalidraw Collaboration Server

WebSocket server for Excalidraw real-time collaboration.

## Features

- Real-time collaboration using Socket.IO
- Room-based collaboration
- Encrypted data transmission
- CORS support for cross-origin requests
- Health check endpoint
- Graceful shutdown handling

## Environment Variables

- `PORT` - Server port (default: 3002)
- `CORS_ORIGIN` - CORS origin (default: '*')
- `NODE_ENV` - Environment (production/development)

## API Endpoints

- `GET /` - Server status
- `GET /health` - Health check

## Socket.IO Events

### Client to Server
- `join-room` - Join a collaboration room
- `server` - Send encrypted scene data
- `server-volatile` - Send volatile data (cursors, etc.)

### Server to Client
- `init-room` - Room initialization
- `new-user` - New user joined
- `room-user-change` - Room users updated
- `client` - Receive encrypted scene data
- `client-volatile` - Receive volatile data

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm install
npm start
```

## Railway Deployment

This server is configured to run as a separate service in Railway alongside the main Excalidraw application. The Railway configuration automatically:

1. Builds the server with `npm install`
2. Starts it with `npm start`
3. Exposes it on the configured port
4. Sets up environment variables for CORS and production mode

The main application references this service via `${{websocket.RAILWAY_PUBLIC_DOMAIN}}` in the environment configuration.