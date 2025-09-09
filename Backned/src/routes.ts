import type { Router } from "express";
import express from "express";
import { dbRun, dbGet } from "./db";

const router: Router = express.Router();

// Health check endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Excalidraw Backend API",
    version: "1.0.0",
    endpoints: {
      scenes: {
        get: "GET /api/scenes/:roomId",
        post: "POST /api/scenes/:roomId"
      },
      permalinks: {
        create: "POST /api/permalinks",
        resolve: "GET /api/permalinks/:permalink"
      }
    },
    status: "running"
  });

// Endpoint for importFromBackend - gets scene by ID
router.get("/api/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbGet(
      "SELECT * FROM scenes WHERE room_id = ?",
      [id]
    );
    if (!result) {
      return res.status(404).json({ error: "scene_not_found" });
    }
    
    // Return the raw binary data
    const buffer = Buffer.from(result.ciphertext, 'base64');
    res.set('Content-Type', 'application/octet-stream');
    return res.send(buffer);
  } catch (err) {
    console.error("GET /api/:id error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});
});

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Scenes API
router.get("/api/scenes/:roomId", async (req, res) => {
  const { roomId } = req.params;
  try {
    const result = await dbGet(
      "SELECT * FROM scenes WHERE room_id = ?",
      [roomId]
    );
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
  if (typeof scene_version !== "number" || typeof iv !== "string" || typeof ciphertext !== "string") {
    return res.status(400).json({ error: "invalid_payload" });
  }
  try {
    await dbRun(
      `INSERT OR REPLACE INTO scenes (room_id, scene_version, iv, ciphertext, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [roomId, scene_version, iv, ciphertext]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/scenes/:roomId error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// Endpoint for exportToBackend - creates new scene and returns ID
router.post("/api/scenes/", async (req, res) => {
  try {
    // Generate a unique room ID
    const roomId = Math.random().toString(36).slice(2, 15);
    
    // For exportToBackend, we expect raw binary data in the body
    const buffer = req.body;
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return res.status(400).json({ error: "invalid_payload" });
    }
    
    // Store the raw encrypted data
    await dbRun(
      `INSERT INTO scenes (room_id, scene_version, iv, ciphertext, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [roomId, 1, "", buffer.toString('base64')]
    );
    
    return res.json({ id: roomId });
  } catch (err) {
    console.error("POST /api/scenes/ error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// Permalinks
function generatePermalink(): string {
  return Math.random().toString(36).slice(2, 10);
}

router.post("/api/permalinks", async (req, res) => {
  const { room_id, room_key, student_name } = req.body || {};
  if (typeof room_id !== "string" || typeof room_key !== "string") {
    return res.status(400).json({ error: "invalid_payload" });
  }
  const permalink = generatePermalink();
  try {
    await dbRun(
      `INSERT INTO permalinks (permalink, room_id, room_key, student_name) VALUES (?, ?, ?, ?)`,
      [permalink, room_id, room_key, student_name || null]
    );
    return res.json({ permalink });
  } catch (err) {
    console.error("POST /api/permalinks error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

router.get("/api/permalinks/:permalink", async (req, res) => {
  const { permalink } = req.params;
  try {
    const result = await dbGet(
      "SELECT * FROM permalinks WHERE permalink = ? AND is_active = 1",
      [permalink]
    );
    if (!result) return res.status(404).json({ error: "not_found" });
    await dbRun("UPDATE permalinks SET last_accessed = datetime('now') WHERE permalink = ?", [permalink]);
    return res.json({ roomId: result.room_id, roomKey: result.room_key, studentName: result.student_name || undefined });
  } catch (err) {
    console.error("GET /api/permalinks/:permalink error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;