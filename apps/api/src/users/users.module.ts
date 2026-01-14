import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { RoleAssignmentEntity } from '../entities/role-assignment.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleAssignmentEntity])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
