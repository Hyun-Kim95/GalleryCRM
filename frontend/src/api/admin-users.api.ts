import { apiClient } from './client';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  teamId: string | null;
  team?: {
    id: string;
    name: string;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminUserDto {
  email: string;
  name: string;
  role: string; // 'ADMIN' | 'MANAGER' | 'STAFF'
  teamId?: string;
  initialPassword: string;
}

export interface UpdateAdminUserDto {
  role?: string;
  teamId?: string;
  isActive?: boolean;
}

export interface ResetPasswordDto {
  newPassword: string;
}

export const adminUsersApi = {
  getAll: async (): Promise<AdminUser[]> => {
    const res = await apiClient.get<AdminUser[]>('/admin/users');
    return res.data;
  },

  create: async (data: CreateAdminUserDto): Promise<AdminUser> => {
    const res = await apiClient.post<AdminUser>('/admin/users', data);
    return res.data;
  },

  update: async (id: string, data: UpdateAdminUserDto): Promise<AdminUser> => {
    const res = await apiClient.patch<AdminUser>(`/admin/users/${id}`, data);
    return res.data;
  },

  resetPassword: async (id: string, data: ResetPasswordDto): Promise<void> => {
    await apiClient.patch(`/admin/users/${id}/reset-password`, data);
  },
};
