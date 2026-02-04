import { apiClient } from './client';

export interface DashboardStats {
  totalCustomers: number;
  pendingCustomers: number;
  pendingAccessRequests: number;
  recentArtists: number;
  recentActivities: {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userName: string;
    createdAt: string;
  }[];
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};

