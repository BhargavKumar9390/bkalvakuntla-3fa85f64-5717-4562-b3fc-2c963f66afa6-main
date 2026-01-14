export enum RoleName {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

export enum Permission {
  CREATE_TASK = 'CREATE_TASK',
  READ_TASK = 'READ_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  TOGGLE_COMPLETE = 'TOGGLE_COMPLETE',
  VIEW_AUDIT = 'VIEW_AUDIT',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  CREATE_ORG = 'CREATE_ORG',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum Category {
  WORK = 'WORK',
  PERSONAL = 'PERSONAL',
  URGENT = 'URGENT',
  OTHER = 'OTHER',
}
