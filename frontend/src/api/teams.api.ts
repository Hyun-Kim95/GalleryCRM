import { apiClient } from './client';

export interface TeamUser {
  id: string;
  email: string;
  name: string;
  role: 'MASTER' | 'ADMIN' | 'MANAGER' | 'STAFF';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users?: TeamUser[];
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const teamsApi = {
  getAll: async (): Promise<Team[]> => {
    const response = await apiClient.get<Team[]>('/teams');
    return response.data;
  },

  getById: async (id: string): Promise<Team> => {
    const response = await apiClient.get<Team>(`/teams/${id}`);
    return response.data;
  },

  create: async (payload: CreateTeamPayload): Promise<Team> => {
    const response = await apiClient.post<Team>('/teams', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateTeamPayload): Promise<Team> => {
    const response = await apiClient.patch<Team>(`/teams/${id}`, payload);
    return response.data;
  },
};

