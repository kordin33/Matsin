import sqlite3 from "sqlite3";
import { promisify } from "util";
import dotenv from "dotenv";

dotenv.config();

const db = new sqlite3.Database(process.env.DATABASE_PATH || "./excalidraw.db");

// Promisify database methods
const dbRun = promisify(db.run.bind(db)) as (...args: any[]) => Promise<any>;
const dbGet = promisify(db.get.bind(db)) as (...args: any[]) => Promise<any>;
const dbAll = promisify(db.all.bind(db)) as (...args: any[]) => Promise<any>;

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
        teacher_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME,
        is_active INTEGER DEFAULT 1
      )
    `);

    // Create teachers table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS teachers (
        teacher_id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        token TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME,
        is_active INTEGER DEFAULT 1
      )
    `);

    // Create room files table for binary attachments (images etc.)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS room_files (
        room_id TEXT NOT NULL,
        file_id TEXT NOT NULL,
        data BLOB NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id, file_id)
      )
    `);

    // Attempt to add missing teacher_id column for existing DBs (ignore error if exists)
    try {
      await dbRun(`ALTER TABLE permalinks ADD COLUMN teacher_id TEXT`);
    } catch (e) {
      // ignore if column already exists
    }

    // Create indexes
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_scenes_updated_at ON scenes(updated_at)
    `);
    
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_permalinks_room_id ON permalinks(room_id)
    `);

    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_permalinks_teacher_id ON permalinks(teacher_id)
    `);

    // Drop legacy unique index on student_name to allow same names across teachers
    try {
      await dbRun(`DROP INDEX IF EXISTS idx_permalinks_student_name`);
    } catch (e) {
      // ignore
    }

    // Enforce uniqueness per teacher+student (when both provided)
    await dbRun(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_permalinks_teacher_student
      ON permalinks(teacher_id, student_name)
      WHERE student_name IS NOT NULL AND teacher_id IS NOT NULL
    `);

    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_room_files_room_id ON room_files(room_id)
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to init DB", error);
    throw error;
  }
};
