import { v4 as uuidv4 } from 'uuid';
import { AuditLog, AuditAction } from '../types';

/**
 * In-memory storage for audit logs (replace with database in production)
 */
class AuditLogStore {
  private logs: Map<string, AuditLog> = new Map();

  create(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      id: uuidv4(),
      ...log,
      timestamp: new Date(),
    };
    this.logs.set(newLog.id, newLog);
    return newLog;
  }

  findById(id: string): AuditLog | undefined {
    return this.logs.get(id);
  }

  findByUserId(userId: string): AuditLog[] {
    return Array.from(this.logs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  findByResource(resource: string, resourceId: string): AuditLog[] {
    return Array.from(this.logs.values())
      .filter(log => log.resource === resource && log.resourceId === resourceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  findByAction(action: AuditAction): AuditLog[] {
    return Array.from(this.logs.values())
      .filter(log => log.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  findBySeverity(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): AuditLog[] {
    return Array.from(this.logs.values())
      .filter(log => log.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  findRecent(limit: number = 100): AuditLog[] {
    return Array.from(this.logs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const auditLogStore = new AuditLogStore();
