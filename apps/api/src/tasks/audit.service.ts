import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');
  constructor(@InjectRepository(AuditLogEntity) private repo: Repository<AuditLogEntity>) {}

  async log(userId: string, action: string, resource?: string, resourceId?: string, meta?: Record<string, any>) {
    const entry = this.repo.create({ userId, action, resource, resourceId, meta });
    await this.repo.save(entry);
    this.logger.log(`${userId} ${action} ${resource || ''} ${resourceId || ''}`);
  }

  async getAll() {
    return this.repo.find({ order: { timestamp: 'DESC' } });
  }
}
