import { apiClient } from './client';
import type { Note, CreateNoteRequest } from '@/types';

export const notesApi = {
  getByCustomer: async (customerId: string): Promise<Note[]> => {
    const response = await apiClient.get<Note[]>(`/notes/customer/${customerId}`);
    return response.data;
  },

  create: async (data: CreateNoteRequest): Promise<Note> => {
    const response = await apiClient.post<Note>('/notes', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`);
  },
};
