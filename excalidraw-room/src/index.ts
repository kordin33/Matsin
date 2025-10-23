import debug from "debug";
import express from "express";
import cors, { CorsOptions } from "cors";
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
  teacher_id: string | null;
  created_at: string;
  last_accessed: string | null;
  is_active: boolean;
}

interface TeacherRow {
  teacher_id: string;
  name: string | null;
  email: string | null;
  token: string;
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

const rawCorsOrigin = process.env.CORS_ORIGIN || "*";
const computedOrigins =
  rawCorsOrigin === "*"
    ? true
    : rawCorsOrigin
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: computedOrigins,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-admin-token"],
};

const corsMiddleware = cors(corsOptions);
app.use(corsMiddleware);
app.options("*", corsMiddleware);
const port = Number(process.env.PORT || 3002); // default port to listen

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
        teacher_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_accessed TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS teachers (
        teacher_id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_accessed TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE INDEX IF NOT EXISTS idx_permalinks_permalink ON permalinks(permalink);
      CREATE INDEX IF NOT EXISTS idx_permalinks_room_id ON permalinks(room_id);
      CREATE INDEX IF NOT EXISTS idx_permalinks_teacher_id ON permalinks(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_teachers_created_at ON teachers(created_at);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_permalinks_teacher_student
        ON permalinks(teacher_id, student_name)
        WHERE student_name IS NOT NULL AND teacher_id IS NOT NULL;
    `);
    serverDebug("DB initialized or already present");
  } finally {
    client.release();
  }
}

initDb().catch((err) => {
  console.error("Failed to init DB", err);
});

// Seed defaults (one teacher + one test permalink) if enabled via env
async function seedDefaults() {
  if (!pool) return;
  try {
    const enable = (process.env.SEED_ENABLE || '').toLowerCase() === 'true';
    if (!enable) return;

    const teacherName = process.env.SEED_TEACHER_NAME || 'Test Teacher';
    const teacherEmail = process.env.SEED_TEACHER_EMAIL || null;
    const teacherId = process.env.SEED_TEACHER_ID || Math.random().toString(36).slice(2, 12);
    const teacherToken = process.env.SEED_TEACHER_TOKEN || Math.random().toString(36).slice(2, 18);

    const client = await pool.connect();
    try {
      // Ensure teacher exists
      const t = await client.query<TeacherRow>(
        `SELECT * FROM teachers WHERE teacher_id = $1 LIMIT 1`,
        [teacherId],
      );
      if (t.rows.length === 0) {
        await client.query(
          `INSERT INTO teachers (teacher_id, name, email, token) VALUES ($1, $2, $3, $4)`,
          [teacherId, teacherName, teacherEmail, teacherToken],
        );
        serverDebug(`Seed: created teacher ${teacherId}`);
      }

      // Ensure a test permalink exists for a test student
      const studentName = process.env.SEED_STUDENT_NAME || 'Test Student';
      const testPermalinkId = process.env.SEED_STUDENT_PERMALINK || null;

      const existing = await client.query<PermalinkRow>(
        `SELECT * FROM permalinks WHERE teacher_id = $1 AND student_name = $2 AND is_active = TRUE LIMIT 1`,
        [teacherId, studentName],
      );
      let permalink = existing.rows[0]?.permalink;
      if (!permalink) {
        const roomId = process.env.SEED_ROOM_ID || Math.random().toString(36).slice(2, 12);
        const roomKey = process.env.SEED_ROOM_KEY || (() => {
          const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
          let out = '';
          for (let i = 0; i < 22; i++) {
            out += alphabet[Math.floor(Math.random() * alphabet.length)];
          }
          return out;
        })();
        const pl = testPermalinkId || Math.random().toString(36).slice(2, 10);
        await client.query(
          `INSERT INTO permalinks (permalink, room_id, room_key, student_name, teacher_id) VALUES ($1, $2, $3, $4, $5)`,
          [pl, roomId, roomKey, studentName, teacherId],
        );
        permalink = pl;
        serverDebug(`Seed: created test permalink ${permalink}`);
      }

      const appOrigin = process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : (process.env.APP_ORIGIN || 'http://localhost:3000');

      console.log('[SEED] Teacher:', teacherId, 'Token:', teacherToken);
      console.log('[SEED] Teacher panel:', `${appOrigin}/?teacher=${encodeURIComponent(teacherId)}&t=${encodeURIComponent(teacherToken)}`);
      console.log('[SEED] Test student permalink:', `${appOrigin}/?permalink=${encodeURIComponent(permalink)}&student=${encodeURIComponent(studentName)}`);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Seed defaults error:', err);
  }
}

seedDefaults();

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

function generateId(len = 10): string {
  return Math.random().toString(36).slice(2, 2 + len);
}

const isAdmin = (req: express.Request) => {
  const token = req.header("x-admin-token");
  return !!token && !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
};

const assertTeacherToken = async (
  teacherId: string,
  token: string,
  opts?: { updateAccess?: boolean },
): Promise<boolean> => {
  if (!pool || !teacherId || !token) {
    return false;
  }
  const result = await pool.query<TeacherRow>(
    `SELECT * FROM teachers WHERE teacher_id = $1 AND is_active = TRUE LIMIT 1`,
    [teacherId],
  );
  const row = result.rows[0];
  if (row && row.token === token) {
    if (opts?.updateAccess !== false) {
      await pool.query(
        `UPDATE teachers SET last_accessed = NOW() WHERE teacher_id = $1`,
        [teacherId],
      );
    }
    return true;
  }
  return false;
};

app.post("/api/permalinks", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  const {
    room_id,
    room_key,
    student_name,
    teacher_id,
    teacher_token,
  } = req.body || {};
  if (
    typeof room_id !== "string" ||
    typeof room_key !== "string" ||
    (teacher_id != null && typeof teacher_id !== "string")
  ) {
    return res.status(400).json({ error: "invalid_payload" });
  }

  const normalizedTeacherId =
    typeof teacher_id === "string" && teacher_id.trim().length > 0
      ? teacher_id.trim()
      : null;
  const normalizedStudentName =
    typeof student_name === "string" && student_name.trim().length > 0
      ? student_name.trim()
      : null;

  if (normalizedTeacherId) {
    if (typeof teacher_token !== "string" || !teacher_token.trim()) {
      return res.status(403).json({ error: "forbidden" });
    }
    const valid = await assertTeacherToken(
      normalizedTeacherId,
      teacher_token.trim(),
    );
    if (!valid) {
      return res.status(403).json({ error: "forbidden" });
    }
  }

  const permalink = generatePermalink();
  try {
    // 1) If teacher+student provided, return existing mapping if any
    if (normalizedTeacherId && normalizedStudentName) {
      const existingByTeacherStudent = await pool.query<{ permalink: string }>(
        `SELECT permalink FROM permalinks WHERE teacher_id = $1 AND student_name = $2 AND is_active = TRUE LIMIT 1`,
        [normalizedTeacherId, normalizedStudentName],
      );
      if (existingByTeacherStudent.rows[0]?.permalink) {
        return res.json({
          permalink: existingByTeacherStudent.rows[0].permalink,
        });
      }
    }

    // 2) If a mapping already exists for the room, reuse it to keep the link stable
    const existingByRoom = await pool.query<{ permalink: string }>(
      `SELECT permalink FROM permalinks WHERE room_id = $1 AND room_key = $2 AND is_active = TRUE LIMIT 1`,
      [room_id, room_key],
    );
    if (existingByRoom.rows[0]?.permalink) {
      return res.json({ permalink: existingByRoom.rows[0].permalink });
    }

    // 3) Create a new permalink
    await pool.query(
      `INSERT INTO permalinks (permalink, room_id, room_key, student_name, teacher_id) VALUES ($1, $2, $3, $4, $5)`,
      [
        permalink,
        room_id,
        room_key,
        normalizedStudentName || null,
        normalizedTeacherId || null,
      ],
    );
    return res.json({ permalink });
  } catch (err: any) {
    if (
      (err?.code === "23505" || err?.constraint === "idx_permalinks_teacher_student") &&
      normalizedTeacherId &&
      normalizedStudentName
    ) {
      try {
        const existing = await pool.query<{ permalink: string }>(
          `SELECT permalink FROM permalinks WHERE teacher_id = $1 AND student_name = $2 AND is_active = TRUE LIMIT 1`,
          [normalizedTeacherId, normalizedStudentName],
        );
        if (existing.rows[0]?.permalink) {
          return res.json({ permalink: existing.rows[0].permalink });
        }
      } catch (lookupError) {
        console.error("POST /api/permalinks lookup error", lookupError);
      }
    }
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
    const row = result.rows[0];
    await pool.query("UPDATE permalinks SET last_accessed = NOW() WHERE permalink = $1", [permalink]);
    if (row.teacher_id) {
      await pool.query(
        "UPDATE teachers SET last_accessed = NOW() WHERE teacher_id = $1",
        [row.teacher_id],
      );
    }
    return res.json({ roomId: row.room_id, roomKey: row.room_key, studentName: row.student_name || undefined });
  } catch (err) {
    console.error("GET /api/permalinks/:permalink error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// List permalinks for a teacher (requires teacher token)
app.get("/api/permalinks", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  const teacher_id = (req.query?.teacher_id as string | undefined)?.trim();
  const token = (req.query?.token as string | undefined)?.trim();
  if (!teacher_id) return res.status(400).json({ error: "missing_teacher_id" });
  if (!token) return res.status(403).json({ error: "forbidden" });
  try {
    const ok = await assertTeacherToken(teacher_id, token);
    if (!ok) return res.status(403).json({ error: "forbidden" });
    const result = await pool.query(
      `SELECT permalink, room_id, room_key, student_name, created_at, last_accessed, is_active
       FROM permalinks WHERE teacher_id = $1 AND is_active = TRUE
       ORDER BY created_at DESC`,
      [teacher_id],
    );
    return res.json({ items: result.rows });
  } catch (err) {
    console.error("GET /api/permalinks?teacher_id error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// Deactivate a permalink (requires teacher token)
app.delete("/api/permalinks/:permalink", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  const { permalink } = req.params as { permalink: string };
  const teacher_id = (req.query?.teacher_id as string | undefined)?.trim();
  const token = (req.query?.token as string | undefined)?.trim();
  if (!teacher_id) return res.status(400).json({ error: "missing_teacher_id" });
  if (!token) return res.status(403).json({ error: "forbidden" });
  try {
    const ok = await assertTeacherToken(teacher_id, token);
    if (!ok) return res.status(403).json({ error: "forbidden" });
    await pool.query(
      `UPDATE permalinks SET is_active = FALSE WHERE permalink = $1 AND teacher_id = $2`,
      [permalink, teacher_id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/permalinks/:permalink error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// Teacher-protected endpoints
app.get("/api/teachers/:teacherId/permalinks", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  const { teacherId: rawTeacherId } = req.params as { teacherId: string };
  const teacherId = rawTeacherId.trim();
  const token = (req.query?.token as string) || "";
  if (!token) return res.status(403).json({ error: "forbidden" });
  try {
    const ok = await assertTeacherToken(teacherId, token);
    if (!ok) return res.status(403).json({ error: "forbidden" });
    const result = await pool.query(
      `SELECT permalink, room_id, room_key, student_name, created_at, last_accessed, is_active
       FROM permalinks WHERE teacher_id = $1 AND is_active = TRUE ORDER BY created_at DESC`,
      [teacherId],
    );
    return res.json({ items: result.rows });
  } catch (err) {
    console.error("GET /api/teachers/:teacherId/permalinks error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.delete("/api/teachers/:teacherId/permalinks/:permalink", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  const { teacherId: rawTeacherId, permalink } = req.params as {
    teacherId: string;
    permalink: string;
  };
  const teacherId = rawTeacherId.trim();
  const token = (req.query?.token as string) || "";
  if (!token) return res.status(403).json({ error: "forbidden" });
  try {
    const ok = await assertTeacherToken(teacherId, token);
    if (!ok) return res.status(403).json({ error: "forbidden" });
    await pool.query(
      `UPDATE permalinks SET is_active = FALSE WHERE permalink = $1 AND teacher_id = $2`,
      [permalink, teacherId],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/teachers/:teacherId/permalinks/:permalink error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// Admin endpoints to provision teachers
app.post("/api/admin/teachers", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  if (!isAdmin(req)) return res.status(403).json({ error: "forbidden" });
  const { name, email } = req.body || {};
  if (name != null && typeof name !== "string") return res.status(400).json({ error: "invalid_payload" });
  if (email != null && typeof email !== "string") return res.status(400).json({ error: "invalid_payload" });
  try {
    const teacher_id = generateId(10);
    const token = generateId(16);
    await pool.query(
      `INSERT INTO teachers (teacher_id, name, email, token) VALUES ($1, $2, $3, $4)`,
      [teacher_id, name || null, email || null, token],
    );
    return res.json({ teacher_id, token });
  } catch (err) {
    console.error("POST /api/admin/teachers error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.post("/api/admin/teachers/upload", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  if (!isAdmin(req)) return res.status(403).json({ error: "forbidden" });
  const { csv } = req.body || {};
  if (typeof csv !== "string") return res.status(400).json({ error: "invalid_payload" });
  try {
    const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (!lines.length) return res.json({ items: [] });
    let start = 0;
    if (/name|email/i.test(lines[0])) {
      start = 1;
    }
    const results: any[] = [];
    for (let i = start; i < lines.length; i++) {
      const parts = lines[i].split(",").map((s) => s.trim());
      const [name, email] = parts;
      const teacher_id = generateId(10);
      const token = generateId(16);
      await pool.query(
        `INSERT INTO teachers (teacher_id, name, email, token) VALUES ($1, $2, $3, $4)`,
        [teacher_id, name || null, email || null, token],
      );
      results.push({ teacher_id, token, name, email });
    }
    return res.json({ items: results });
  } catch (err) {
    console.error("POST /api/admin/teachers/upload error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.get("/api/admin/teachers", async (req, res) => {
  if (!pool) return res.status(500).json({ error: "db_unavailable" });
  if (!isAdmin(req)) return res.status(403).json({ error: "forbidden" });
  try {
    const result = await pool.query(
      `SELECT teacher_id, name, email, token, created_at, last_accessed, is_active FROM teachers ORDER BY created_at DESC`,
    );
    return res.json({ items: result.rows });
  } catch (err) {
    console.error("GET /api/admin/teachers error", err);
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
      allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
      origin: computedOrigins,
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

