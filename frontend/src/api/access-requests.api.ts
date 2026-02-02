import { apiClient } from './client';

export enum AccessRequestTargetType {
  CUSTOMER = 'CUSTOMER',
  TRANSACTION = 'TRANSACTION',
}

export enum AccessRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface AccessRequest {
  id: string;
  requesterId: string;
  requester: {
    id: string;
    name: string;
    email: string;
  };
  targetType: AccessRequestTargetType;
  targetId: string;
  reason: string | null;
  status: AccessRequestStatus;
  approvedById: string | null;
  approvedBy: {
    id: string;
    name: string;
  } | null;
  approvedAt: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccessRequestDto {
  targetType: AccessRequestTargetType;
  targetId: string;
  reason?: string;
}

export interface ApproveAccessRequestDto {
  status: AccessRequestStatus.APPROVED | AccessRequestStatus.REJECTED;
  accessDurationHours?: number;
  rejectionReason?: string;
}

export const accessRequestsApi = {
  getAll: async (): Promise<AccessRequest[]> => {
    const response = await apiClient.get<AccessRequest[]>('/access-requests');
    return response.data;
  },

  getById: async (id: string): Promise<AccessRequest> => {
    const response = await apiClient.get<AccessRequest>(`/access-requests/${id}`);
    return response.data;
  },

  create: async (data: CreateAccessRequestDto): Promise<AccessRequest> => {
    const response = await apiClient.post<AccessRequest>('/access-requests', data);
    return response.data;
  },

  approve: async (id: string, data: ApproveAccessRequestDto): Promise<AccessRequest> => {
    const response = await apiClient.patch<AccessRequest>(`/access-requests/${id}/approve`, data);
    return response.data;
  },
};

