import { reconcileElements } from "@excalidraw/excalidraw";
import { restoreElements } from "@excalidraw/excalidraw/data/restore";
import { encryptData, decryptData } from "@excalidraw/excalidraw/data/encryption";
import { getSceneVersion } from "@excalidraw/element";

import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import type { AppState } from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/element/types";
import type { Socket } from "socket.io-client";

import { getSyncableElements } from ".";
import type { SyncableExcalidrawElement } from ".";
import type Portal from "../collab/Portal";
import { apiClient } from "./api-client";

class SceneVersionCache {
  private static cache = new WeakMap<Socket, number>();
  static get = (socket: Socket) => SceneVersionCache.cache.get(socket);
  static set = (socket: Socket, elements: readonly SyncableExcalidrawElement[]) => {
    SceneVersionCache.cache.set(socket, getSceneVersion(elements));
  };
}

const encryptElements = async (
  key: string,
  elements: readonly OrderedExcalidrawElement[],
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> => {
  const json = JSON.stringify(elements);
  const encoded = new TextEncoder().encode(json);
  const { encryptedBuffer, iv } = await encryptData(key, encoded);
  return { ciphertext: encryptedBuffer, iv };
};

const decryptElements = async (
  ciphertextBase64: string,
  ivBase64: string,
  roomKey: string,
) => {
  const ciphertext = new Uint8Array(Buffer.from(ciphertextBase64, "base64"));
  const iv = new Uint8Array(Buffer.from(ivBase64, "base64"));
  const decrypted = await decryptData(iv, ciphertext, roomKey);
  const decodedData = new TextDecoder("utf-8").decode(new Uint8Array(decrypted));
  return JSON.parse(decodedData) as readonly OrderedExcalidrawElement[];
};

export const isSavedToServer = (
  portal: Portal,
  elements: readonly SyncableExcalidrawElement[],
): boolean => {
  if (portal.socket && portal.roomId && portal.roomKey) {
    const sceneVersion = getSceneVersion(elements);
    return SceneVersionCache.get(portal.socket) === sceneVersion;
  }
  return true;
};

export const saveToServer = async (
  portal: Portal,
  elements: readonly SyncableExcalidrawElement[],
  appState: AppState,
) => {
  const { roomId, roomKey, socket } = portal;
  if (!roomId || !roomKey || !socket || isSavedToServer(portal, elements)) {
    return null;
  }

  const sceneVersion = getSceneVersion(elements);
  const { ciphertext, iv } = await encryptElements(roomKey, elements);

  await apiClient.saveScene(
    roomId,
    sceneVersion,
    Buffer.from(iv).toString("base64"),
    Buffer.from(ciphertext).toString("base64"),
  );

  const restored = getSyncableElements(
    restoreElements(
      await decryptElements(
        Buffer.from(ciphertext).toString("base64"),
        Buffer.from(iv).toString("base64"),
        roomKey,
      ),
      null,
    ),
  );

  SceneVersionCache.set(socket, restored);
  return restored;
};

export const loadFromServer = async (
  roomId: string,
  roomKey: string,
  socket: Socket | null,
) => {
  const scene = await apiClient.getScene(roomId);
  if (!scene) return null;

  const elements = getSyncableElements(
    restoreElements(
      await decryptElements(scene.ciphertext, scene.iv, roomKey),
      null,
    ),
  );

  if (socket) {
    SceneVersionCache.set(socket, elements);
  }

  return elements;
};

