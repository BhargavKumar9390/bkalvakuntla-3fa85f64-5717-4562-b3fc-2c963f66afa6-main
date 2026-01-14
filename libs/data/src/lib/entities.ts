import { RoleName, TaskStatus, Category } from './enums';

export interface Organization {
  id: string;
  name: string;
  parentId?: string | null; // for 2-level hierarchy
}

export interface RoleAssignment {
  role: RoleName;
  organizationId: string; // scope of the role
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string; // persisted only on server
  displayName?: string;
  organizationId: string; // primary organization
  roles: RoleAssignment[]; // roles across orgs
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  ownerId: string; // `User.id` who created/owns the task
  organizationId: string; // task's org scope
  status: TaskStatus;
  category: Category;
  createdAt: string;
  updatedAt?: string;
}
