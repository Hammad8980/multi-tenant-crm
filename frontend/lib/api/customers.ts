import { apiClient } from './client';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  AssignCustomerRequest,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export const customersApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Customer>> => {
    const response = await apiClient.get<PaginatedResponse<Customer>>('/customers', {
      params,
    });
    return response.data;
  },

  getOne: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.post<Customer>('/customers', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.patch<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  restore: async (id: string): Promise<Customer> => {
    const response = await apiClient.post<Customer>(`/customers/${id}/restore`);
    return response.data;
  },

  assign: async (id: string, data: AssignCustomerRequest): Promise<Customer> => {
    const response = await apiClient.post<Customer>(`/customers/${id}/assign`, data);
    return response.data;
  },

  unassign: async (id: string): Promise<Customer> => {
    const response = await apiClient.post<Customer>(`/customers/${id}/unassign`);
    return response.data;
  },
};
