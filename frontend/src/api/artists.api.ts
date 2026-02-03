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

export interface CreateArtistDto {
  name: string;
  nationality?: string;
  genre?: string;
  bio?: string;
  isActive?: boolean;
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

  create: async (data: CreateArtistDto): Promise<Artist> => {
    const response = await apiClient.post<Artist>('/artists', data);
    return response.data;
  },
};


