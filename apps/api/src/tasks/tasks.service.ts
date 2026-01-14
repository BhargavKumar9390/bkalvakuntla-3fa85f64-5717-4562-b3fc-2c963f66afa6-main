import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from '../entities/task.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity) private tasksRepo: Repository<TaskEntity>,
    @InjectRepository(AuditLogEntity) private auditRepo: Repository<AuditLogEntity>,
  ) {}

  async create(task: Partial<TaskEntity>, userId: string, organizationId?: string) {
    const orgId = organizationId || (task as any).organizationId;
    if (!orgId) throw new BadRequestException('organizationId is required to create a task');
    const t = this.tasksRepo.create({ ...task, ownerId: userId, organizationId: orgId });
    const saved = await this.tasksRepo.save(t);
    await this.auditRepo.save(this.auditRepo.create({ userId, action: 'CREATE_TASK', resource: 'task', resourceId: saved.id }));
    return saved;
  }

  async findAll(filter: any, visibleOrgIds: string[]) {
    const qb = this.tasksRepo.createQueryBuilder('t');
    if (filter.status) qb.andWhere('t.status = :status', { status: filter.status });
    if (filter.category) qb.andWhere('t.category = :category', { category: filter.category });
    if (filter.ownerId) qb.andWhere('t.ownerId = :ownerId', { ownerId: filter.ownerId });

    if (visibleOrgIds && visibleOrgIds.length > 0) qb.andWhere('t.organizationId IN (:...orgs)', { orgs: visibleOrgIds });

    qb.orderBy('t.position', 'ASC');
    return qb.getMany();
  }

  async findById(id: string) {
    return this.tasksRepo.findOne({ where: { id } });
  }

  async update(id: string, patch: Partial<TaskEntity>, userId: string) {
    const t = await this.findById(id);
    if (!t) throw new NotFoundException('Task not found');
    const merged = Object.assign(t, patch);
    const saved = await this.tasksRepo.save(merged);
    await this.auditRepo.save(this.auditRepo.create({ userId, action: 'UPDATE_TASK', resource: 'task', resourceId: id }));
    return saved;
  }

  async remove(id: string, userId: string) {
    const t = await this.findById(id);
    if (!t) throw new NotFoundException('Task not found');
    await this.tasksRepo.remove(t);
    await this.auditRepo.save(this.auditRepo.create({ userId, action: 'DELETE_TASK', resource: 'task', resourceId: id }));
    return { success: true };
  }

  async reorder(ids: string[], userId: string) {
    // update position according to order in ids array
    const items = await this.tasksRepo.findByIds(ids as any[]);
    const map = new Map(items.map((it) => [it.id, it]));
    const updated: TaskEntity[] = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const it = map.get(id);
      if (it) {
        it.position = i;
        updated.push(it);
      }
    }
    await this.tasksRepo.save(updated);
    await this.auditRepo.save(this.auditRepo.create({ userId, action: 'REORDER_TASKS', resource: 'task' }));
    return { success: true };
  }
}
