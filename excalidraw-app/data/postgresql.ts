// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Only import pg in Node.js environment
let Pool: any = null;
if (!isBrowser) {
  try {
    const pg = require('pg');
    Pool = pg.Pool;
  } catch (error) {
    console.warn('PostgreSQL not available in this environment');
  }
}

import {
  encryptData,
  decryptData,
} from "@excalidraw/excalidraw/data/encryption";
import { restoreElements } from "@excalidraw/excalidraw/data/restore";
import { getSceneVersion } from "@excalidraw/element";
import { reconcileElements } from "@excalidraw/excalidraw";

import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import type {
  ExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/element/types";
import type {
  AppState,
} from "@excalidraw/excalidraw/types";

import { getSyncableElements } from ".";
import type { SyncableExcalidrawElement } from ".";
import type Portal from "../collab/Portal";
import type { Socket } from "socket.io-client";

// PostgreSQL connection will be configured in getPool function
let pool: any = null;

const getPool = () => {
  // Return null in browser environment
  if (isBrowser || !Pool) {
    return null;
  }
  
  if (!pool) {
    pool = new Pool({
      connectionString: import.meta.env.VITE_APP_DATABASE_URL || process.env.DATABASE_URL,
      host: import.meta.env.VITE_APP_POSTGRES_HOST || process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(import.meta.env.VITE_APP_POSTGRES_PORT || process.env.POSTGRES_PORT || '5432'),
      database: import.meta.env.VITE_APP_POSTGRES_DATABASE || process.env.POSTGRES_DATABASE || 'excalidraw',
      user: import.meta.env.VITE_APP_POSTGRES_USER || process.env.POSTGRES_USER || 'postgres',
      password: import.meta.env.VITE_APP_POSTGRES_PASSWORD || process.env.POSTGRES_PASSWORD || 'password',
      ssl: import.meta.env.MODE === 'production' || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
};

type PostgreSQLStoredScene = {
  room_id: string;
  scene_version: number;
  iv: string;
  ciphertext: string;
  updated_at: Date;
};

const encryptElements = async (
  key: string,
  elements: readonly ExcalidrawElement[],
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> => {
  const json = JSON.stringify(elements);
  const encoded = new TextEncoder().encode(json);
  const { encryptedBuffer, iv } = await encryptData(key, encoded);

  return { ciphertext: encryptedBuffer, iv };
};

const decryptElements = async (
  data: PostgreSQLStoredScene,
  roomKey: string,
): Promise<readonly ExcalidrawElement[]> => {
  const ciphertext = new Uint8Array(Buffer.from(data.ciphertext, 'base64'));
  const iv = new Uint8Array(Buffer.from(data.iv, 'base64'));

  const decrypted = await decryptData(iv, ciphertext, roomKey);
  const decodedData = new TextDecoder("utf-8").decode(
    new Uint8Array(decrypted),
  );
  return JSON.parse(decodedData);
};

class PostgreSQLSceneVersionCache {
  private static cache = new WeakMap<Socket, number>();
  static get = (socket: Socket) => {
    return PostgreSQLSceneVersionCache.cache.get(socket);
  };
  static set = (
    socket: Socket,
    elements: readonly SyncableExcalidrawElement[],
  ) => {
    PostgreSQLSceneVersionCache.cache.set(socket, getSceneVersion(elements));
  };
}

export const isSavedToPostgreSQL = (
  portal: Portal,
  elements: readonly ExcalidrawElement[],
): boolean => {
  if (portal.socket && portal.roomId && portal.roomKey) {
    const sceneVersion = getSceneVersion(elements);
    return PostgreSQLSceneVersionCache.get(portal.socket) === sceneVersion;
  }
  return true;
};

const createPostgreSQLSceneDocument = async (
  elements: readonly SyncableExcalidrawElement[],
  roomKey: string,
) => {
  const sceneVersion = getSceneVersion(elements);
  const { ciphertext, iv } = await encryptElements(roomKey, elements);
  return {
    scene_version: sceneVersion,
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
  };
};

export const saveToPostgreSQL = async (
  portal: Portal,
  elements: readonly SyncableExcalidrawElement[],
  appState: AppState,
) => {
  const { roomId, roomKey, socket } = portal;
  if (
    !roomId ||
    !roomKey ||
    !socket ||
    isSavedToPostgreSQL(portal, elements)
  ) {
    return null;
  }

  const pool = getPool();
  if (!pool) {
    console.warn('PostgreSQL not available in browser environment');
    return null;
  }
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get existing scene
    const existingResult = await client.query(
      'SELECT * FROM scenes WHERE room_id = $1',
      [roomId]
    );

    let storedScene;

    if (existingResult.rows.length === 0) {
      // Create new scene
      storedScene = await createPostgreSQLSceneDocument(elements, roomKey);
      
      await client.query(
        'INSERT INTO scenes (room_id, scene_version, iv, ciphertext, updated_at) VALUES ($1, $2, $3, $4, NOW())',
        [roomId, storedScene.scene_version, storedScene.iv, storedScene.ciphertext]
      );
    } else {
      // Update existing scene
      const prevStoredScene = existingResult.rows[0] as PostgreSQLStoredScene;
      const prevStoredElements = getSyncableElements(
        restoreElements(await decryptElements(prevStoredScene, roomKey), null),
      );
      const reconciledElements = getSyncableElements(
        reconcileElements(
          elements,
          prevStoredElements as OrderedExcalidrawElement[] as RemoteExcalidrawElement[],
          appState,
        ),
      );

      storedScene = await createPostgreSQLSceneDocument(
        reconciledElements,
        roomKey,
      );

      await client.query(
        'UPDATE scenes SET scene_version = $2, iv = $3, ciphertext = $4, updated_at = NOW() WHERE room_id = $1',
        [roomId, storedScene.scene_version, storedScene.iv, storedScene.ciphertext]
      );
    }

    await client.query('COMMIT');

    const storedElements = getSyncableElements(
      restoreElements(await decryptElements({ ...storedScene, room_id: roomId, updated_at: new Date() }, roomKey), null),
    );

    PostgreSQLSceneVersionCache.set(socket, storedElements);

    return storedElements;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const loadFromPostgreSQL = async (
  roomId: string,
  roomKey: string,
  socket: Socket | null,
): Promise<readonly SyncableExcalidrawElement[] | null> => {
  const pool = getPool();
  if (!pool) {
    console.warn('PostgreSQL not available in browser environment');
    return null;
  }
  
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT * FROM scenes WHERE room_id = $1',
      [roomId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const storedScene = result.rows[0] as PostgreSQLStoredScene;
    const elements = getSyncableElements(
      restoreElements(await decryptElements(storedScene, roomKey), null),
    );

    if (socket) {
      PostgreSQLSceneVersionCache.set(socket, elements);
    }

    return elements;
  } finally {
    client.release();
  }
};

// Initialize database tables
export const initializeDatabase = async () => {
  const pool = getPool();
  if (!pool) {
    console.warn('PostgreSQL not available in browser environment');
    return;
  }
  
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS scenes (
        room_id VARCHAR(255) PRIMARY KEY,
        scene_version INTEGER NOT NULL,
        iv TEXT NOT NULL,
        ciphertext TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scenes_updated_at ON scenes(updated_at)
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};