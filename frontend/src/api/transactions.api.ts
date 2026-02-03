import { apiClient } from './client';

export enum TransactionStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Transaction {
  id: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
  };
  artistId: string;
  artist: {
    id: string;
    name: string;
  };
  amount: number;
  currency: string;
  contractTerms: string | null;
  transactionDate: string;
  status: TransactionStatus;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
  };
  teamId: string;
  team: {
    id: string;
    name: string;
  };
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

export interface CreateTransactionDto {
  customerId: string;
  artistId: string;
  amount: number;
  currency?: string;
  contractTerms?: string;
  transactionDate: string;
  teamId: string;
}

export const transactionsApi = {
  getAll: async (): Promise<Transaction[]> => {
    const response = await apiClient.get<Transaction[]>('/transactions');
    return response.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  create: async (data: CreateTransactionDto): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>('/transactions', data);
    return response.data;
  },

  submitForApproval: async (id: string): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>(`/transactions/${id}/submit`);
    return response.data;
  },
};


