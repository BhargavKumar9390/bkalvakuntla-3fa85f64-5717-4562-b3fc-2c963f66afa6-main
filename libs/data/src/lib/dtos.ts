import { Category, TaskStatus } from './enums';

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  expiresIn: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  organizationId: string;
  category?: Category;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: Category;
}

export interface TaskFilterDto {
  organizationIds?: string[];
  status?: TaskStatus;
  category?: Category;
  ownerId?: string;
}
