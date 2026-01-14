import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { RoleAssignmentEntity } from './role-assignment.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column()
  organizationId: string;

  @OneToMany(() => RoleAssignmentEntity, (r) => r.user, { cascade: true })
  roles: RoleAssignmentEntity[];
}
