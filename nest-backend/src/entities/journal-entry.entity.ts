import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

@Entity({ name: 'journal_entries' })
export class JournalEntryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column()
  description!: string;

  @Column({ default: 'manual' })
  source!: 'payroll' | 'manual';

  @Column({ unique: true })
  reference!: string;

  @Column({ type: 'simple-json', default: '[]' })
  lines!: JournalLine[];

  @CreateDateColumn()
  createdAt!: Date;
}
