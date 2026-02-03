import { apiClient } from './client';

export enum ArtistStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Artist {
  id: string;
  name: string;
  nationality: string | null;
  genre: string | null;
  bio: string | null;
  isActive: boolean;
  status: ArtistStatus;
  createdById: string | null;
  approvedById: string | null;
  approvedBy: {
    id: string;
    name: string;
  } | null;
  approvedAt: string | null;
  rejectionReason: string | null;
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

export interface UpdateArtistDto {
  name?: string;
  nationality?: string;
  genre?: string;
  bio?: string;
  isActive?: boolean;
}

export interface ApproveArtistDto {
  status: ArtistStatus;
  rejectionReason?: string;
}

export const artistsApi = {
  getAll: async (): Promise<Artist[]> => {
    const response = await apiClient.get<Artist[]>('/artists');
    return response.data;
  },

  getPending: async (): Promise<Artist[]> => {
    const response = await apiClient.get<Artist[]>('/artists/pending');
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

  update: async (id: string, data: UpdateArtistDto): Promise<Artist> => {
    const response = await apiClient.patch<Artist>(`/artists/${id}`, data);
    return response.data;
  },

  submitForApproval: async (id: string): Promise<Artist> => {
    const response = await apiClient.post<Artist>(`/artists/${id}/submit`, {});
    return response.data;
  },

  approve: async (id: string, data: ApproveArtistDto): Promise<Artist> => {
    const response = await apiClient.patch<Artist>(`/artists/${id}/approve`, data);
    return response.data;
  },
};


