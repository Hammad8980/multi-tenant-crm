import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { Customer } from '../../customers/entities/customer.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('notes')
@Index(['customerId', 'organizationId'])
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Customer, (customer) => customer.notes)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
