export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  timestamp: string;
  meta?: Record<string, any>;
}
