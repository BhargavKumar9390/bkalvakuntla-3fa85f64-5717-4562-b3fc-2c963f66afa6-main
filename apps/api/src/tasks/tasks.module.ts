import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from '../entities/task.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuditService } from './audit.service';
import { OrgsModule } from '../orgs/orgs.module';
import {
  JwtAuthGuard,
  RbacGuard,
} from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/auth';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, AuditLogEntity]), OrgsModule],
  providers: [TasksService, AuditService, JwtAuthGuard, RbacGuard],
  controllers: [TasksController],
  exports: [TasksService, AuditService],
})
export class TasksModule {}
