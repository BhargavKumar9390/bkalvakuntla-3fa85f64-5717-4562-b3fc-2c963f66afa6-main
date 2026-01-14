import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  TaskStatus,
  Category,
} from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/data';

@Entity('task')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  ownerId: string;

  @Column()
  organizationId: string;

  @Column({ type: 'varchar', default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'varchar', default: Category.OTHER })
  category: Category;

  @Column({ type: 'varchar', default: 'Medium', nullable: true })
  priority?: string;

  @Column({ nullable: true })
  @Column({ type: 'datetime', nullable: true })
  dueDate?: Date;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
