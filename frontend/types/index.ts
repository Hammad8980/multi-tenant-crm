// API Response Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organizationId: string;
  assignedTo?: string;
  assignedToUser?: User;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Note {
  id: string;
  content: string;
  customerId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  organizationId: string;
  userId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organizationId: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Customer Types
export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface AssignCustomerRequest {
  userId: string;
}

// Note Types
export interface CreateNoteRequest {
  content: string;
  customerId: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
}
