import type { Router } from "express";
import express from "express";
import { dbRun, dbGet, dbAll } from "./db";

const router: Router = express.Router();

// Root info
router.get("/", (_req, res) => {
  res.json({
    message: "Excalidraw Backend API",
    version: "1.0.0",
    endpoints: {
      scenes: {
        get: "GET /api/scenes/:roomId",
        post: "POST /api/scenes/:roomId",
      },
      permalinks: {
        create: "POST /api/permalinks",
        resolve: "GET /api/permalinks/:permalink",
      },
    },
    status: "running",
  });
});

// Health
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Legacy: importFromBackend (binary)
router.get("/api/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbGet("SELECT * FROM scenes WHERE room_id = ?", [id]);
    if (!result) return res.status(404).json({ error: "scene_not_found" });
    const buffer = Buffer.from(result.ciphertext, "base64");
    res.set("Content-Type", "application/octet-stream");
    return res.send(buffer);
  } catch (err) {
    console.error("GET /api/:id error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// Scenes API (JSON)
router.get("/api/scenes/:roomId", async (req, res) => {
  const { roomId } = req.params;
  try {
    const result = await dbGet("SELECT * FROM scenes WHERE room_id = ?", [roomId]);
    if (!result) return res.status(404).json({ error: "not_found" });
    return res.json(result);
  } catch (err) {
    console.error("GET /api/scenes/:roomId error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

router.post("/api/scenes/:roomId", async (req, res) => {
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
    await dbRun(
      `INSERT OR REPLACE INTO scenes (room_id, scene_version, iv, ciphertext, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [roomId, scene_version, iv, ciphertext],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/scenes/:roomId error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// Shareable link (binary) exact endpoint with raw body
router.post(
  "/api/scenes/",
  express.raw({ type: "*/*", limit: "10mb" }),
  async (req, res) => {
    try {
      const roomId = Math.random().toString(36).slice(2, 15);
      const buffer = req.body;
      if (!buffer || !Buffer.isBuffer(buffer)) {
        return res.status(400).json({ error: "invalid_payload" });
      }
      await dbRun(
        `INSERT INTO scenes (room_id, scene_version, iv, ciphertext, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [roomId, 1, "", buffer.toString("base64")],
      );
      return res.json({ id: roomId });
    } catch (err) {
      console.error("POST /api/scenes/ error", err);
      return res.status(500).json({ error: "internal_error" });
    }
  },
);

// Permalinks
function generatePermalink(): string {
  return Math.random().toString(36).slice(2, 10);
}

function generateId(len = 10): string {
  return Math.random().toString(36).slice(2, 2 + len);
}

const isAdmin = (req: express.Request) => {
  const token = req.header("x-admin-token");
  return token && process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
};

const getTeacherById = async (teacherId: string) => {
  return dbGet(
    `SELECT * FROM teachers WHERE teacher_id = ? AND is_active = 1 LIMIT 1`,
    [teacherId],
  );
};

const assertTeacherToken = async (
  teacherId: string,
  token: string,
): Promise<boolean> => {
  const t = await getTeacherById(teacherId);
  return !!t && t.token === token;
};

router.post("/api/permalinks", async (req, res) => {
  const { room_id, room_key, student_name, teacher_id } = req.body || {};
  if (
    typeof room_id !== "string" ||
    typeof room_key !== "string" ||
    (teacher_id != null && typeof teacher_id !== "string")
  ) {
    return res.status(400).json({ error: "invalid_payload" });
  }
  try {
    // 1) If teacher+student provided, return existing mapping if any
    if (teacher_id && student_name && typeof student_name === "string") {
      const existingByTeacherStudent = await dbGet(
        `SELECT permalink FROM permalinks WHERE teacher_id = ? AND student_name = ? AND is_active = 1 LIMIT 1`,
        [teacher_id, student_name],
      );
      if (existingByTeacherStudent?.permalink) {
        return res.json({ permalink: existingByTeacherStudent.permalink });
      }
    }

    // 2) If a mapping already exists for the room, reuse it to keep the link stable
    const existingByRoom = await dbGet(
      `SELECT permalink FROM permalinks WHERE room_id = ? AND room_key = ? AND is_active = 1 LIMIT 1`,
      [room_id, room_key],
    );
    if (existingByRoom?.permalink) {
      return res.json({ permalink: existingByRoom.permalink });
    }

    // 3) Create a new permalink
    const permalink = generatePermalink();
    await dbRun(
      `INSERT INTO permalinks (permalink, room_id, room_key, student_name, teacher_id) VALUES (?, ?, ?, ?, ?)`,
      [permalink, room_id, room_key, student_name || null, teacher_id || null],
    );
    return res.json({ permalink });
  } catch (err) {
    // Handle unique constraint on (teacher_id, student_name) by returning existing
    if ((err as any)?.code === "SQLITE_CONSTRAINT") {
      try {
        const existing = await dbGet(
          `SELECT permalink FROM permalinks WHERE teacher_id = ? AND student_name = ? AND is_active = 1 LIMIT 1`,
          [teacher_id, student_name],
        );
        if (existing?.permalink) {
          return res.json({ permalink: existing.permalink });
        }
      } catch (_) {}
    }
    console.error("POST /api/permalinks error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// List permalinks for a teacher
router.get("/api/permalinks", async (req, res) => {
  const { teacher_id } = req.query as { teacher_id?: string };
  if (!teacher_id) {
    return res.status(400).json({ error: "missing_teacher_id" });
  }
  try {
    const rows = await dbAll(
      `SELECT permalink, room_id, room_key, student_name, created_at, last_accessed, is_active
       FROM permalinks WHERE teacher_id = ? AND is_active = 1 ORDER BY created_at DESC`,
      [teacher_id],
    );
    return res.json({ items: rows });
  } catch (err) {
    console.error("GET /api/permalinks?teacher_id error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// Deactivate a permalink (teacher-managed)
router.delete("/api/permalinks/:permalink", async (req, res) => {
  const { permalink } = req.params;
  const { teacher_id } = req.query as { teacher_id?: string };
  if (!teacher_id) {
    return res.status(400).json({ error: "missing_teacher_id" });
  }
  try {
    const result = await dbRun(
      `UPDATE permalinks SET is_active = 0 WHERE permalink = ? AND teacher_id = ?`,
      [permalink, teacher_id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/permalinks/:permalink error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// Teacher-protected endpoints
router.get("/api/teachers/:teacherId/permalinks", async (req, res) => {
  const { teacherId } = req.params as { teacherId: string };
  const { token } = req.query as { token?: string };
  if (!token) return res.status(403).json({ error: "forbidden" });
  try {
    const ok = await assertTeacherToken(teacherId, token);
    if (!ok) return res.status(403).json({ error: "forbidden" });
    const rows = await dbAll(
      `SELECT permalink, room_id, room_key, student_name, created_at, last_accessed, is_active
       FROM permalinks WHERE teacher_id = ? AND is_active = 1 ORDER BY created_at DESC`,
      [teacherId],
    );
    return res.json({ items: rows });
  } catch (err) {
    console.error("GET /api/teachers/:teacherId/permalinks error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

router.delete(
  "/api/teachers/:teacherId/permalinks/:permalink",
  async (req, res) => {
    const { teacherId, permalink } = req.params as {
      teacherId: string;
      permalink: string;
    };
    const { token } = req.query as { token?: string };
    if (!token) return res.status(403).json({ error: "forbidden" });
    try {
      const ok = await assertTeacherToken(teacherId, token);
      if (!ok) return res.status(403).json({ error: "forbidden" });
      await dbRun(
        `UPDATE permalinks SET is_active = 0 WHERE permalink = ? AND teacher_id = ?`,
        [permalink, teacherId],
      );
      return res.json({ ok: true });
    } catch (err) {
      console.error(
        "DELETE /api/teachers/:teacherId/permalinks/:permalink error",
        err,
      );
      return res.status(500).json({ error: "internal_error" });
    }
  },
);

// Admin endpoints
router.post("/api/admin/teachers", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "forbidden" });
  const { name, email } = req.body || {};
  if (typeof name !== "string") return res.status(400).json({ error: "invalid_payload" });
  try {
    const teacher_id = generateId(10);
    const token = generateId(16);
    await dbRun(
      `INSERT INTO teachers (teacher_id, name, email, token) VALUES (?, ?, ?, ?)`
        ,
      [teacher_id, name || null, email || null, token],
    );
    return res.json({ teacher_id, token });
  } catch (err) {
    console.error("POST /api/admin/teachers error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

router.post("/api/admin/teachers/upload", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "forbidden" });
  const { csv } = req.body || {};
  if (typeof csv !== "string") return res.status(400).json({ error: "invalid_payload" });
  try {
    const lines = csv.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
    if (!lines.length) return res.json({ items: [] });
    // support optional header
    let start = 0;
    let hasHeader = false;
    if (/name|email/i.test(lines[0])) {
      hasHeader = true;
      start = 1;
    }
    const results: any[] = [];
    for (let i = start; i < lines.length; i++) {
      const parts = lines[i].split(",").map((s: string) => s.trim());
      const [name, email] = parts;
      const teacher_id = generateId(10);
      const token = generateId(16);
      await dbRun(
        `INSERT INTO teachers (teacher_id, name, email, token) VALUES (?, ?, ?, ?)`
          ,
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

router.get("/api/admin/teachers", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "forbidden" });
  try {
    const rows = await dbAll(
      `SELECT teacher_id, name, email, token, created_at, last_accessed, is_active FROM teachers ORDER BY created_at DESC`,
    );
    return res.json({ items: rows });
  } catch (err) {
    console.error("GET /api/admin/teachers error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

router.get("/api/permalinks/:permalink", async (req, res) => {
  const { permalink } = req.params;
  try {
    const result = await dbGet(
      "SELECT * FROM permalinks WHERE permalink = ? AND is_active = 1",
      [permalink],
    );
    if (!result) return res.status(404).json({ error: "not_found" });
    await dbRun(
      "UPDATE permalinks SET last_accessed = datetime('now') WHERE permalink = ?",
      [permalink],
    );
    return res.json({
      roomId: result.room_id,
      roomKey: result.room_key,
      studentName: result.student_name || undefined,
    });
  } catch (err) {
    console.error("GET /api/permalinks/:permalink error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
