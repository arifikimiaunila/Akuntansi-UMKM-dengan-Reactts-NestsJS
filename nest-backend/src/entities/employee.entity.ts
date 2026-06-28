import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type BusinessScale = 'kaki-lima' | 'umkm' | 'resto-bintang-5';

@Entity({ name: 'employees' })
export class EmployeeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  position!: string;

  @Column({ type: 'varchar', default: 'umkm' })
  scale!: BusinessScale;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  baseSalary!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxPercent!: number;

  @Column()
  bankAccount!: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
