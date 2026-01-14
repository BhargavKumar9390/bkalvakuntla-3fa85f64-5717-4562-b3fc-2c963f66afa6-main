import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_log')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  resource?: string;

  @Column({ nullable: true })
  resourceId?: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'simple-json', nullable: true })
  meta?: Record<string, any>;
}
