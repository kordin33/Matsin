import debug from "debug";
import express from "express";
import http from "http";
import { Server as SocketIO } from "socket.io";
import { Pool } from "pg";
import path from "path";

// Types
interface SceneRow {
  room_id: string;
  scene_version: number;
  iv: string;
  ciphertext: string;
  created_at: string;
  updated_at: string;
}

interface PermalinkRow {
  id: number;
  permalink: string;
  room_id: string;
  room_key: string;
  student_name: string | null;
  created_at: string;
  last_accessed: string | null;
  is_active: boolean;
}

type UserToFollow = {
  socketId: string;
  username: string;
};

type OnUserFollowedPayload = {
  userToFollow: UserToFollow;
  action: "FOLLOW" | "UNFOLLOW";
};

const serverDebug = debug("server");
const ioDebug = debug("io");
const socketDebug = debug("socket");

require("dotenv").config(
  process.env.NODE_ENV !== "development"
    ? { path: ".env.production" }
    : { path: ".env.development" },
);

const app = express();
const port =
  process.env.PORT || (process.env.NODE_ENV !== "development" ? 80 : 3002); // default port to listen

// Middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_APP_DATABASE_URL;

const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL, ssl: DATABASE_URL.includes("railway.app") ? { rejectUnauthorized: false } : undefined })
  : null;

async function initDb() {
  if (!pool) {
    serverDebug("No DATABASE_URL provided. Skipping DB init.");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS scenes (
        room_id TEXT PRIMARY KEY,
        scene_version INTEGER NOT NULL,
        iv TEXT NOT NULL,
        ciphertext TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS permalinks (
        id SERIAL PRIMARY KEY,
        permalink TEXT UNIQUE NOT NULL,
        room_id TEXT NOT NULL,
        room_key TEXT NOT NULL,
        student_name TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_accessed TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE INDEX IF NOT EXISTS idx_permalinks_permalink ON permalinks(permalink);
      CREATE INDEX IF NOT EXISTS idx_permalinks_room_id ON permalinks(room_id);
    `);
    serverDebug("DB initialized or already present");
  } finally {
    client.release();
  }
}

initDb().catch((err) => {
  console.error("Failed to init DB", err);
});

// REST API
app.get("/api/scenes/:roomId", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  const { roomId } = req.params;
  try {
    const result = await pool.query<SceneRow>("SELECT * FROM scenes WHERE room_id = $1", [roomId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "not_found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/scenes/:roomId error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.post("/api/scenes/:roomId", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  const { roomId } = req.params;
  const { scene_version, iv, ciphertext } = req.body || {};
  if (
    typeof scene_version !== "number" ||
    typeof iv !== "string" ||
    typeof ciphertext !== "string"
  ) {
    return res.status(400).json({ error: "invalid_payload" });
  }
  try {
    await pool.query(
      `INSERT INTO scenes (room_id, scene_version, iv, ciphertext)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (room_id)
       DO UPDATE SET scene_version = EXCLUDED.scene_version, iv = EXCLUDED.iv, ciphertext = EXCLUDED.ciphertext, updated_at = NOW()`,
      [roomId, scene_version, iv, ciphertext],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/scenes/:roomId error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

function generatePermalink(): string {
  // Simple random permalink; in production consider stronger approach
  return Math.random().toString(36).slice(2, 10);
}

app.post("/api/permalinks", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  const { room_id, room_key, student_name } = req.body || {};
  if (typeof room_id !== "string" || typeof room_key !== "string") {
    return res.status(400).json({ error: "invalid_payload" });
  }
  const permalink = generatePermalink();
  try {
    await pool.query(
      `INSERT INTO permalinks (permalink, room_id, room_key, student_name) VALUES ($1, $2, $3, $4)`,
      [permalink, room_id, room_key, student_name || null],
    );
    return res.json({ permalink });
  } catch (err) {
    console.error("POST /api/permalinks error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.get("/api/permalinks/:permalink", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  const { permalink } = req.params;
  try {
    const result = await pool.query<PermalinkRow>(
      "SELECT * FROM permalinks WHERE permalink = $1 AND is_active = true",
      [permalink],
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "not_found" });
    await pool.query("UPDATE permalinks SET last_accessed = NOW() WHERE permalink = $1", [permalink]);
    const row = result.rows[0];
    return res.json({ roomId: row.room_id, roomKey: row.room_key, studentName: row.student_name || undefined });
  } catch (err) {
    console.error("GET /api/permalinks/:permalink error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.get("/", (req, res) => {
  res.send("Excalidraw collaboration server is up :)");
});

const server = http.createServer(app);

server.listen(port, () => {
  serverDebug(`listening on port: ${port}`);
});

try {
  const io = new SocketIO(server, {
    transports: ["websocket", "polling"],
    cors: {
      allowedHeaders: ["Content-Type", "Authorization"],
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    },
    allowEIO3: true,
  });

  io.on("connection", (socket) => {
    ioDebug("connection established!");
    io.to(`${socket.id}`).emit("init-room");
    socket.on("join-room", async (roomID) => {
      socketDebug(`${socket.id} has joined ${roomID}`);
      await socket.join(roomID);
      const sockets = await io.in(roomID).fetchSockets();
      if (sockets.length <= 1) {
        io.to(`${socket.id}`).emit("first-in-room");
      } else {
        socketDebug(`${socket.id} new-user emitted to room ${roomID}`);
        socket.broadcast.to(roomID).emit("new-user", socket.id);
      }

      io.in(roomID).emit(
        "room-user-change",
        sockets.map((socket) => socket.id),
      );
    });

    socket.on(
      "server-broadcast",
      (roomID: string, encryptedData: ArrayBuffer, iv: Uint8Array) => {
        socketDebug(`${socket.id} sends update to ${roomID}`);
        socket.broadcast.to(roomID).emit("client-broadcast", encryptedData, iv);
      },
    );

    socket.on(
      "server-volatile-broadcast",
      (roomID: string, encryptedData: ArrayBuffer, iv: Uint8Array) => {
        socketDebug(`${socket.id} sends volatile update to ${roomID}`);
        socket.volatile.broadcast
          .to(roomID)
          .emit("client-broadcast", encryptedData, iv);
      },
    );

    socket.on("user-follow", async (payload: OnUserFollowedPayload) => {
      const roomID = `follow@${payload.userToFollow.socketId}`;

      switch (payload.action) {
        case "FOLLOW": {
          await socket.join(roomID);

          const sockets = await io.in(roomID).fetchSockets();
          const followedBy = sockets.map((socket) => socket.id);

          io.to(payload.userToFollow.socketId).emit(
            "user-follow-room-change",
            followedBy,
          );

          break;
        }
        case "UNFOLLOW": {
          await socket.leave(roomID);

          const sockets = await io.in(roomID).fetchSockets();
          const followedBy = sockets.map((socket) => socket.id);

          io.to(payload.userToFollow.socketId).emit(
            "user-follow-room-change",
            followedBy,
          );

          break;
        }
      }
    });

    socket.on("disconnecting", async () => {
      socketDebug(`${socket.id} has disconnected`);
      for (const roomID of Array.from(socket.rooms)) {
        const otherClients = (await io.in(roomID).fetchSockets()).filter(
          (_socket) => _socket.id !== socket.id,
        );

        const isFollowRoom = roomID.startsWith("follow@");

        if (!isFollowRoom && otherClients.length > 0) {
          socket.broadcast.to(roomID).emit(
            "room-user-change",
            otherClients.map((socket) => socket.id),
          );
        }

        if (isFollowRoom && otherClients.length === 0) {
          const socketId = roomID.replace("follow@", "");
          io.to(socketId).emit("broadcast-unfollow");
        }
      }
    });

    socket.on("disconnect", () => {
      socket.removeAllListeners();
      socket.disconnect();
    });
  });
} catch (error) {
  console.error(error);
}
