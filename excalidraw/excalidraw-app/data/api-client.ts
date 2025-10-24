import type { SyncableExcalidrawElement } from "./index";

export const getServerUrl = () => {
  if (typeof window !== "undefined") {
    return (
      import.meta.env.VITE_APP_WS_SERVER_URL ||
      import.meta.env.VITE_APP_BACKEND_URL ||
      "https://websocket-production-e339.up.railway.app"
    );
  }
  return (
    process.env.WS_SERVER_URL ||
    process.env.BACKEND_URL ||
    "http://localhost"
  );
};

const CHUNK_SIZE = 0x8000;

const uint8ToBase64 = (buffer: Uint8Array) => {
  if (typeof window === "undefined") {
    const nodeBuffer = (globalThis as any).Buffer;
    if (nodeBuffer) {
      return nodeBuffer.from(buffer).toString("base64");
    }
  }

  let binary = "";
  for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
    const chunk = buffer.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode(...Array.from(chunk));
  }
  return btoa(binary);
};

const base64ToUint8 = (value: string) => {
  if (typeof window === "undefined") {
    const nodeBuffer = (globalThis as any).Buffer;
    if (nodeBuffer) {
      return new Uint8Array(nodeBuffer.from(value, "base64"));
    }
  }
  const binary = atob(value);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export interface ApiScene {
  room_id: string;
  scene_version: number;
  iv: string;
  ciphertext: string;
  updated_at: string;
}

export interface PermalinkCreateRequest {
  room_id: string;
  room_key: string;
  student_name?: string;
  teacher_id?: string;
  teacher_token?: string;
}

export interface PermalinkResponse {
  permalink: string;
}

export interface PermalinkData {
  roomId: string;
  roomKey: string;
  studentName?: string;
}

export interface TeacherPermalinkItem {
  permalink: string;
  room_id: string;
  room_key: string;
  student_name: string | null;
  teacher_name?: string | null;
  created_at: string;
  last_accessed: string | null;
  is_active: number;
}

export interface TeacherPermalinkList {
  items: TeacherPermalinkItem[];
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getServerUrl();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Scene API
  async getScene(roomId: string): Promise<ApiScene | null> {
    try {
      return await this.request<ApiScene>(`/api/scenes/${roomId}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not_found')) {
        return null;
      }
      throw error;
    }
  }

  async saveScene(
    roomId: string,
    sceneVersion: number,
    iv: string,
    ciphertext: string
  ): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>(`/api/scenes/${roomId}`, {
      method: 'POST',
      body: JSON.stringify({
        scene_version: sceneVersion,
        iv,
        ciphertext,
      }),
    });
  }

  // Permalink API
  async createPermalink(data: PermalinkCreateRequest): Promise<PermalinkResponse> {
    return this.request<PermalinkResponse>('/api/permalinks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resolvePermalink(permalink: string): Promise<PermalinkData | null> {
    try {
      return await this.request<PermalinkData>(`/api/permalinks/${permalink}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not_found')) {
        return null;
      }
      throw error;
    }
  }

  async listPermalinks(teacherId: string, token: string): Promise<TeacherPermalinkList> {
    const params = new URLSearchParams({ teacher_id: teacherId, token });
    return this.request<TeacherPermalinkList>(`/api/permalinks?${params.toString()}`);
  }

  async deletePermalink(permalink: string, teacherId: string, token: string): Promise<{ ok: boolean }> {
    const params = new URLSearchParams({ teacher_id: teacherId, token });
    return this.request<{ ok: boolean }>(`/api/permalinks/${encodeURIComponent(permalink)}?${params.toString()}`, {
      method: 'DELETE',
    });
  }

  // Teacher-protected endpoints (token-aware)
  async listTeacherPermalinks(teacherId: string, token: string): Promise<TeacherPermalinkList> {
    const params = new URLSearchParams({ token });
    return this.request<TeacherPermalinkList>(`/api/teachers/${encodeURIComponent(teacherId)}/permalinks?${params.toString()}`);
  }

  async deleteTeacherPermalink(teacherId: string, permalink: string, token: string): Promise<{ ok: boolean }> {
    const params = new URLSearchParams({ token });
    return this.request<{ ok: boolean }>(`/api/teachers/${encodeURIComponent(teacherId)}/permalinks/${encodeURIComponent(permalink)}?${params.toString()}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  async uploadFiles(
    roomId: string,
    files: { id: string; buffer: Uint8Array }[],
  ): Promise<{ savedFiles: string[]; erroredFiles: string[] }> {
    if (!files.length) {
      return { savedFiles: [], erroredFiles: [] };
    }

    return this.request<{ savedFiles: string[]; erroredFiles: string[] }>(
      `/api/rooms/${encodeURIComponent(roomId)}/files`,
      {
        method: "POST",
        body: JSON.stringify({
          files: files.map((file) => ({
            id: file.id,
            data: uint8ToBase64(file.buffer),
          })),
        }),
      },
    );
  }

  async fetchFiles(
    roomId: string,
    ids: readonly string[],
  ): Promise<{ files: { id: string; buffer: Uint8Array }[]; missing: string[] }> {
    if (!ids.length) {
      return { files: [], missing: [] };
    }

    const response = await this.request<{
      files: { id: string; data: string }[];
      missing: string[];
    }>(`/api/rooms/${encodeURIComponent(roomId)}/files/batch`, {
      method: "POST",
      body: JSON.stringify({ ids }),
    });

    return {
      files: (response.files || []).map((file) => ({
        id: file.id,
        buffer: base64ToUint8(file.data),
      })),
      missing: response.missing || [],
    };
  }
}

export const apiClient = new ApiClient();


