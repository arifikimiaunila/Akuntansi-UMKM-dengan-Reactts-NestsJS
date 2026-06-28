import { Column, Entity, PrimaryColumn } from 'typeorm';

export type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

@Entity({ name: 'accounts' })
export class AccountEntity {
  @PrimaryColumn({ length: 12 })
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar' })
  category!: AccountCategory;
}
