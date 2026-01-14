import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { RoleName } from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/data';

@Entity('role_assignment')
export class RoleAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  role: RoleName;

  @Column()
  organizationId: string;

  @ManyToOne(() => UserEntity, (u) => u.roles)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  userId: string;
}
