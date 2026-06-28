import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'payrolls' })
export class PayrollEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  employeeId!: number;

  @Column()
  employeeName!: string;

  @Column({ length: 7 })
  period!: string;

  @Column({ default: 26 })
  attendanceDays!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  overtimeHours!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  incentive!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  grossPay!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  taxAmount!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  bpjsAmount!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  otherDeduction!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  netPay!: number;

  @Column({ default: 'Payroll otomatis' })
  notes!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
