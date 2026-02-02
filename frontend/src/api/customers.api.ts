import { apiClient } from './client';

export enum CustomerStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  teamId: string;
  team: {
    id: string;
    name: string;
  };
  status: CustomerStatus;
  approvedById: string | null;
  approvedBy: {
    id: string;
    name: string;
  } | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  isMasked?: boolean;
  maskingLevel?: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface SearchCustomerParams {
  keyword?: string;
  status?: CustomerStatus;
  teamId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SearchCustomerResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApproveCustomerDto {
  status: CustomerStatus.APPROVED | CustomerStatus.REJECTED;
  rejectionReason?: string;
}

export const customersApi = {
  search: async (params: SearchCustomerParams): Promise<SearchCustomerResponse> => {
    const response = await apiClient.get<SearchCustomerResponse>('/customers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await apiClient.post<Customer>('/customers', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCustomerDto): Promise<Customer> => {
    const response = await apiClient.patch<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  submitForApproval: async (id: string): Promise<Customer> => {
    const response = await apiClient.post<Customer>(`/customers/${id}/submit`);
    return response.data;
  },

  approve: async (id: string, data: ApproveCustomerDto): Promise<Customer> => {
    const response = await apiClient.patch<Customer>(`/customers/${id}/approve`, data);
    return response.data;
  },

  softDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },
};

