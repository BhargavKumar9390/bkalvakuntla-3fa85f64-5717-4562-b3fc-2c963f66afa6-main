import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../entities/user.entity';
import { RoleAssignmentEntity } from '../entities/role-assignment.entity';
import { RoleName } from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/data';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private usersRepo: Repository<UserEntity>,
    @InjectRepository(RoleAssignmentEntity)
    private rolesRepo: Repository<RoleAssignmentEntity>
  ) {}

  async createUser(
    email: string,
    password: string,
    organizationId: string,
    displayName?: string
  ) {
    const hash = await bcrypt.hash(password, 10);
    const user = this.usersRepo.create({
      email,
      passwordHash: hash,
      organizationId,
      displayName,
    });
    return this.usersRepo.save(user);
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email }, relations: ['roles'] });
  }

  async validatePassword(user: UserEntity, password: string) {
    if (!user || !user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async assignRole(userId: string, role: RoleName, organizationId: string) {
    const r = this.rolesRepo.create({
      role: role as any,
      organizationId,
      userId,
    });
    return this.rolesRepo.save(r);
  }
}
