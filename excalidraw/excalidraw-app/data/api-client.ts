import type { SyncableExcalidrawElement } from "./index";

const getServerUrl = () => {
  if (typeof window !== 'undefined') {
    return import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:3005';
  }
  return process.env.BACKEND_URL || 'http://localhost:3005';
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

  async listPermalinks(teacherId: string): Promise<TeacherPermalinkList> {
    const params = new URLSearchParams({ teacher_id: teacherId });
    return this.request<TeacherPermalinkList>(`/api/permalinks?${params.toString()}`);
  }

  async deletePermalink(permalink: string, teacherId: string): Promise<{ ok: boolean }> {
    const params = new URLSearchParams({ teacher_id: teacherId });
    return this.request<{ ok: boolean }>(`/api/permalinks/${encodeURIComponent(permalink)}?${params.toString()}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiClient = new ApiClient();
