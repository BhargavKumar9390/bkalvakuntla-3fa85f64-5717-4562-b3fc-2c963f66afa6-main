import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { OrgsModule } from '../orgs/orgs.module';
import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';
import { RoleAssignmentEntity } from '../entities/role-assignment.entity';
import { TaskEntity } from '../entities/task.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { OrgsService } from '../orgs/orgs.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('sqlite:', '') : './dev.db',
      entities: [OrganizationEntity, UserEntity, RoleAssignmentEntity, TaskEntity, AuditLogEntity],
      synchronize: true,
    }),
    UsersModule,
    OrgsModule,
    AuthModule,
    // Tasks module provides Task endpoints and audit logging
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
