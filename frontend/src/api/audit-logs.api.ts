import { apiClient } from './client';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ACCESS_REQUEST = 'ACCESS_REQUEST',
}

export enum AuditEntityType {
  CUSTOMER = 'CUSTOMER',
  TRANSACTION = 'TRANSACTION',
  ARTIST = 'ARTIST',
  USER = 'USER',
  TEAM = 'TEAM',
}

export interface AuditLog {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface GetAuditLogsParams {
  userId?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  limit?: number;
}

export const auditLogsApi = {
  getAll: async (params?: GetAuditLogsParams): Promise<AuditLog[]> => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.entityType) queryParams.append('entityType', params.entityType);
    if (params?.entityId) queryParams.append('entityId', params.entityId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<AuditLog[]>(
      `/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  },
};


