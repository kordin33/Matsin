import sqlite3 from "sqlite3";
import { promisify } from "util";
import dotenv from "dotenv";

dotenv.config();

const db = new sqlite3.Database(process.env.DATABASE_PATH || "./excalidraw.db");

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

export { db, dbRun, dbGet, dbAll };

export const initDb = async () => {
  try {
    // Create scenes table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS scenes (
        room_id TEXT PRIMARY KEY,
        scene_version INTEGER NOT NULL,
        iv TEXT NOT NULL,
        ciphertext TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create permalinks table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS permalinks (
        permalink TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        room_key TEXT NOT NULL,
        student_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME,
        is_active INTEGER DEFAULT 1
      )
    `);

    // Create indexes
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_scenes_updated_at ON scenes(updated_at)
    `);
    
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_permalinks_room_id ON permalinks(room_id)
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to init DB", error);
    throw error;
  }
};