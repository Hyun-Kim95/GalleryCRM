import { apiClient } from './client';

export interface Artist {
  id: string;
  name: string;
  nationality: string | null;
  genre: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const artistsApi = {
  getAll: async (): Promise<Artist[]> => {
    const response = await apiClient.get<Artist[]>('/artists');
    return response.data;
  },

  getById: async (id: string): Promise<Artist> => {
    const response = await apiClient.get<Artist>(`/artists/${id}`);
    return response.data;
  },
};

