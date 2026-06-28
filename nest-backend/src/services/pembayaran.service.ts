import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity, AccountCategory } from '../entities/account.entity';
import { BusinessScale, EmployeeEntity } from '../entities/employee.entity';
import { JournalEntryEntity, JournalLine } from '../entities/journal-entry.entity';
import { PayrollEntity } from '../entities/payroll.entity';

export interface CreateEmployeeDto {
  name?: string;
  position?: string;
  scale?: BusinessScale;
  baseSalary?: number;
  taxPercent?: number;
  bankAccount?: string;
}

export interface RunPayrollDto {
  employeeId?: number;
  period?: string;
  attendanceDays?: number;
  overtimeHours?: number;
  incentive?: number;
  otherDeduction?: number;
  notes?: string;
}

export interface CreateJournalEntryDto {
  date?: string;
  description?: string;
  reference?: string;
  lines?: Array<{
    accountCode?: string;
    debit?: number;
    credit?: number;
  }>;
}

interface LedgerItem {
  entryId: number;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

interface ServiceError {
  error: string;
}

@Injectable()
export class PembayaranService implements OnModuleInit {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(PayrollEntity)
    private readonly payrollRepository: Repository<PayrollEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepository: Repository<JournalEntryEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAccounts();
    await this.seedEmployees();
  }

  async getEmployees(): Promise<EmployeeEntity[]> {
    return this.employeeRepository.find({ order: { id: 'DESC' } });
  }

  async createEmployee(
    dto: CreateEmployeeDto,
  ): Promise<{ status: string; data: EmployeeEntity } | ServiceError> {
    const name = (dto.name || '').trim();
    const position = (dto.position || '').trim();
    const bankAccount = (dto.bankAccount || '').trim();
    const scale: BusinessScale = dto.scale || 'umkm';
    const baseSalary = Number(dto.baseSalary || 0);
    const taxPercent = Number(dto.taxPercent || 0);

    if (!name) {
      return { error: 'name tidak boleh kosong' };
    }
    if (!position) {
      return { error: 'position tidak boleh kosong' };
    }
    if (!bankAccount) {
      return { error: 'bankAccount tidak boleh kosong' };
    }
    if (baseSalary <= 0) {
      return { error: 'baseSalary harus lebih besar dari 0' };
    }
    if (taxPercent < 0 || taxPercent > 35) {
      return { error: 'taxPercent harus di antara 0 sampai 35' };
    }

    const employee = this.employeeRepository.create({
      name,
      position,
      scale,
      baseSalary,
      taxPercent,
      bankAccount,
      active: true,
    });

    const saved = await this.employeeRepository.save(employee);
    return { status: 'success', data: saved };
  }

  async getPayrollHistory(): Promise<PayrollEntity[]> {
    return this.payrollRepository.find({ order: { id: 'DESC' } });
  }

  async runPayroll(dto: RunPayrollDto): Promise<{ status: string; data: PayrollEntity } | ServiceError> {
    const employeeId = Number(dto.employeeId || 0);
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, active: true },
    });

    if (!employee) {
      return { error: 'Karyawan tidak ditemukan atau tidak aktif' };
    }

    const period = (dto.period || '').trim() || new Date().toISOString().slice(0, 7);
    const attendanceDays = Number(dto.attendanceDays ?? 26);
    const overtimeHours = Number(dto.overtimeHours ?? 0);
    const incentive = Number(dto.incentive ?? 0);
    const otherDeduction = Number(dto.otherDeduction ?? 0);
    const notes = (dto.notes || '').trim() || 'Payroll otomatis';

    if (attendanceDays < 0 || overtimeHours < 0 || incentive < 0 || otherDeduction < 0) {
      return { error: 'Nilai payroll tidak boleh minus' };
    }

    const attendanceRatio = Math.min(attendanceDays / 26, 1);
    const baseByAttendance = this.roundCurrency(Number(employee.baseSalary) * attendanceRatio);
    const overtimePay = this.roundCurrency(overtimeHours * 30000);
    const grossPay = this.roundCurrency(baseByAttendance + overtimePay + incentive);
    const taxAmount = this.roundCurrency((grossPay * Number(employee.taxPercent)) / 100);
    const bpjsAmount = this.roundCurrency(grossPay * 0.02);
    const netPay = this.roundCurrency(grossPay - taxAmount - bpjsAmount - otherDeduction);

    if (netPay < 0) {
      return { error: 'Net pay tidak valid, cek nilai potongan' };
    }

    const payroll = this.payrollRepository.create({
      employeeId: employee.id,
      employeeName: employee.name,
      period,
      attendanceDays,
      overtimeHours,
      incentive,
      grossPay,
      taxAmount,
      bpjsAmount,
      otherDeduction,
      netPay,
      notes,
    });

    const savedPayroll = await this.payrollRepository.save(payroll);
    await this.createPayrollJournal(savedPayroll, overtimePay);

    return { status: 'success', data: savedPayroll };
  }

  async getJournalEntries(): Promise<JournalEntryEntity[]> {
    return this.journalRepository.find({ order: { id: 'DESC' } });
  }

  async createJournalEntry(
    dto: CreateJournalEntryDto,
  ): Promise<{ status: string; data: JournalEntryEntity } | ServiceError> {
    const description = (dto.description || '').trim();
    const date = (dto.date || '').trim() || new Date().toISOString().slice(0, 10);
    const reference = (dto.reference || '').trim() || `MAN-${Date.now()}`;
    const linesInput = dto.lines || [];

    if (!description) {
      return { error: 'description tidak boleh kosong' };
    }
    if (linesInput.length < 2) {
      return { error: 'Minimal 2 baris jurnal' };
    }

    const lines: JournalLine[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of linesInput) {
      const accountCode = (line.accountCode || '').trim();
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);

      if (!accountCode) {
        return { error: 'accountCode wajib diisi' };
      }
      if (debit < 0 || credit < 0) {
        return { error: 'debit/credit tidak boleh minus' };
      }
      if ((debit === 0 && credit === 0) || (debit > 0 && credit > 0)) {
        return { error: 'Setiap baris harus berisi debit atau credit saja' };
      }

      const account = await this.accountRepository.findOne({ where: { code: accountCode } });
      if (!account) {
        return { error: `Akun ${accountCode} tidak ditemukan` };
      }

      totalDebit += debit;
      totalCredit += credit;
      lines.push({
        accountCode,
        accountName: account.name,
        debit: this.roundCurrency(debit),
        credit: this.roundCurrency(credit),
      });
    }

    if (this.roundCurrency(totalDebit) !== this.roundCurrency(totalCredit)) {
      return { error: 'Total debit dan credit harus seimbang' };
    }

    const exists = await this.journalRepository.findOne({ where: { reference } });
    if (exists) {
      return { error: 'reference jurnal sudah digunakan' };
    }

    const entry = this.journalRepository.create({
      date,
      description,
      source: 'manual',
      reference,
      lines,
    });

    const saved = await this.journalRepository.save(entry);
    return { status: 'success', data: saved };
  }

  async getDashboardSummary() {
    const [employees, payrolls, journals, chartOfAccounts] = await Promise.all([
      this.employeeRepository.find({ where: { active: true } }),
      this.payrollRepository.find(),
      this.journalRepository.find(),
      this.accountRepository.find(),
    ]);

    const nowPeriod = new Date().toISOString().slice(0, 7);
    const payrollOutflow = payrolls
      .filter((item) => item.period === nowPeriod)
      .reduce((sum, item) => sum + Number(item.netPay), 0);

    const totalExpense = journals.reduce((sum, entry) => {
      const value = (entry.lines || [])
        .filter((line) => line.accountCode.startsWith('5'))
        .reduce((acc, line) => acc + Number(line.debit || 0), 0);
      return sum + value;
    }, 0);

    const totalCashCredit = journals.reduce((sum, entry) => {
      const value = (entry.lines || [])
        .filter((line) => line.accountCode === '1101')
        .reduce((acc, line) => acc + Number(line.credit || 0), 0);
      return sum + value;
    }, 0);

    return {
      businessReadiness: {
        kakiLima: ['cashflow harian', 'payroll sederhana', 'jurnal kas masuk/keluar'],
        umkm: ['payroll multi-karyawan', 'jurnal berpasangan', 'rekap biaya operasional'],
        restoBintang5: ['kontrol biaya SDM', 'audit trail jurnal', 'laporan periodik manajemen'],
      },
      metrics: {
        activeEmployees: employees.length,
        payrollRunCount: payrolls.length,
        payrollOutflowThisPeriod: this.roundCurrency(payrollOutflow),
        totalJournalEntries: journals.length,
        expenseFromJournals: this.roundCurrency(totalExpense),
        cashOutFromJournals: this.roundCurrency(totalCashCredit),
      },
      chartOfAccounts,
    };
  }

  async getGeneralLedger(accountCode?: string) {
    const journals = await this.journalRepository.find({ order: { date: 'ASC', id: 'ASC' } });
    const filterCode = (accountCode || '').trim();
    const accountMap = new Map<string, LedgerItem[]>();

    for (const entry of journals) {
      for (const line of entry.lines || []) {
        if (filterCode && line.accountCode !== filterCode) {
          continue;
        }

        const list = accountMap.get(line.accountCode) || [];
        const previous = list[list.length - 1]?.runningBalance || 0;
        const runningBalance = this.roundCurrency(previous + Number(line.debit) - Number(line.credit));
        list.push({
          entryId: entry.id,
          date: entry.date,
          description: entry.description,
          reference: entry.reference,
          debit: Number(line.debit),
          credit: Number(line.credit),
          runningBalance,
        });
        accountMap.set(line.accountCode, list);
      }
    }

    const accounts = await this.accountRepository.find();
    return {
      accountCode: filterCode || null,
      accounts: accounts.map((account) => ({
        code: account.code,
        name: account.name,
        category: account.category,
        ledger: accountMap.get(account.code) || [],
      })),
    };
  }

  async getTrialBalance() {
    const accounts = await this.accountRepository.find();
    const journals = await this.journalRepository.find();

    const rows = accounts.map((account) => {
      let debit = 0;
      let credit = 0;

      for (const entry of journals) {
        for (const line of entry.lines || []) {
          if (line.accountCode === account.code) {
            debit += Number(line.debit || 0);
            credit += Number(line.credit || 0);
          }
        }
      }

      const balance = this.roundCurrency(debit - credit);
      return {
        accountCode: account.code,
        accountName: account.name,
        category: account.category,
        totalDebit: this.roundCurrency(debit),
        totalCredit: this.roundCurrency(credit),
        balance,
      };
    });

    const totalDebit = rows.reduce((sum, row) => sum + row.totalDebit, 0);
    const totalCredit = rows.reduce((sum, row) => sum + row.totalCredit, 0);

    return {
      rows,
      totals: {
        debit: this.roundCurrency(totalDebit),
        credit: this.roundCurrency(totalCredit),
        isBalanced: this.roundCurrency(totalDebit) === this.roundCurrency(totalCredit),
      },
    };
  }

  async getIncomeStatement() {
    const accounts = await this.accountRepository.find();
    const journals = await this.journalRepository.find();

    const revenueRows: Array<{ accountCode: string; accountName: string; amount: number }> = [];
    const expenseRows: Array<{ accountCode: string; accountName: string; amount: number }> = [];

    for (const account of accounts) {
      let debit = 0;
      let credit = 0;

      for (const entry of journals) {
        for (const line of entry.lines || []) {
          if (line.accountCode === account.code) {
            debit += Number(line.debit || 0);
            credit += Number(line.credit || 0);
          }
        }
      }

      if (account.category === 'revenue') {
        revenueRows.push({
          accountCode: account.code,
          accountName: account.name,
          amount: this.roundCurrency(credit - debit),
        });
      }

      if (account.category === 'expense') {
        expenseRows.push({
          accountCode: account.code,
          accountName: account.name,
          amount: this.roundCurrency(debit - credit),
        });
      }
    }

    const totalRevenue = revenueRows.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenseRows.reduce((sum, item) => sum + item.amount, 0);

    return {
      revenue: revenueRows,
      expenses: expenseRows,
      totals: {
        totalRevenue: this.roundCurrency(totalRevenue),
        totalExpense: this.roundCurrency(totalExpense),
        netIncome: this.roundCurrency(totalRevenue - totalExpense),
      },
    };
  }

  async getBalanceSheet() {
    const accounts = await this.accountRepository.find();
    const journals = await this.journalRepository.find();
    const accountBalances: Array<{
      accountCode: string;
      accountName: string;
      category: AccountCategory;
      amount: number;
    }> = [];

    for (const account of accounts) {
      let debit = 0;
      let credit = 0;

      for (const entry of journals) {
        for (const line of entry.lines || []) {
          if (line.accountCode === account.code) {
            debit += Number(line.debit || 0);
            credit += Number(line.credit || 0);
          }
        }
      }

      let amount = 0;
      if (account.category === 'asset' || account.category === 'expense') {
        amount = this.roundCurrency(debit - credit);
      } else {
        amount = this.roundCurrency(credit - debit);
      }

      accountBalances.push({
        accountCode: account.code,
        accountName: account.name,
        category: account.category,
        amount,
      });
    }

    const assets = accountBalances.filter((item) => item.category === 'asset');
    const liabilities = accountBalances.filter((item) => item.category === 'liability');
    const equities = accountBalances.filter((item) => item.category === 'equity');

    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    const totalEquities = equities.reduce((sum, item) => sum + item.amount, 0);

    return {
      assets,
      liabilities,
      equities,
      totals: {
        assets: this.roundCurrency(totalAssets),
        liabilities: this.roundCurrency(totalLiabilities),
        equity: this.roundCurrency(totalEquities),
        liabilitiesPlusEquity: this.roundCurrency(totalLiabilities + totalEquities),
      },
    };
  }

  private async createPayrollJournal(payroll: PayrollEntity, overtimePay: number): Promise<void> {
    const payrollReference = `PAY-${payroll.period}-${payroll.id}`;
    const salaryBase = this.roundCurrency(
      Number(payroll.grossPay) - Number(overtimePay) - Number(payroll.incentive),
    );
    const overtimeAndIncentive = this.roundCurrency(Number(overtimePay) + Number(payroll.incentive));

    const lines: JournalLine[] = [
      {
        accountCode: '5101',
        accountName: 'Beban Gaji',
        debit: salaryBase,
        credit: 0,
      },
      {
        accountCode: '5102',
        accountName: 'Beban Tunjangan dan Lembur',
        debit: overtimeAndIncentive,
        credit: 0,
      },
      {
        accountCode: '2101',
        accountName: 'Utang Pajak Karyawan',
        debit: 0,
        credit: Number(payroll.taxAmount),
      },
      {
        accountCode: '2102',
        accountName: 'Utang BPJS',
        debit: 0,
        credit: Number(payroll.bpjsAmount),
      },
      {
        accountCode: '2103',
        accountName: 'Utang Potongan Lain',
        debit: 0,
        credit: Number(payroll.otherDeduction),
      },
      {
        accountCode: '1101',
        accountName: 'Kas dan Bank',
        debit: 0,
        credit: Number(payroll.netPay),
      },
    ];

    await this.journalRepository.save(
      this.journalRepository.create({
        date: new Date().toISOString().slice(0, 10),
        description: `Posting payroll ${payroll.employeeName} periode ${payroll.period}`,
        source: 'payroll',
        reference: payrollReference,
        lines,
      }),
    );
  }

  private async seedEmployees(): Promise<void> {
    const count = await this.employeeRepository.count();
    if (count > 0) {
      return;
    }

    await this.employeeRepository.save([
      this.employeeRepository.create({
        name: 'Siti Rahma',
        position: 'Kasir',
        scale: 'kaki-lima',
        baseSalary: 3000000,
        taxPercent: 1,
        bankAccount: 'BCA-1234567890',
        active: true,
      }),
      this.employeeRepository.create({
        name: 'Andi Pratama',
        position: 'Head Chef',
        scale: 'resto-bintang-5',
        baseSalary: 9500000,
        taxPercent: 5,
        bankAccount: 'Mandiri-9988776655',
        active: true,
      }),
    ]);
  }

  private async seedAccounts(): Promise<void> {
    const defaults: Array<{ code: string; name: string; category: AccountCategory }> = [
      { code: '1101', name: 'Kas dan Bank', category: 'asset' },
      { code: '1201', name: 'Piutang Usaha', category: 'asset' },
      { code: '2101', name: 'Utang Pajak Karyawan', category: 'liability' },
      { code: '2102', name: 'Utang BPJS', category: 'liability' },
      { code: '2103', name: 'Utang Potongan Lain', category: 'liability' },
      { code: '3101', name: 'Modal Pemilik', category: 'equity' },
      { code: '4101', name: 'Pendapatan Penjualan', category: 'revenue' },
      { code: '5101', name: 'Beban Gaji', category: 'expense' },
      { code: '5102', name: 'Beban Tunjangan dan Lembur', category: 'expense' },
      { code: '5201', name: 'Beban Sewa', category: 'expense' },
      { code: '5202', name: 'Beban Utilitas', category: 'expense' },
    ];

    for (const account of defaults) {
      const exists = await this.accountRepository.findOne({ where: { code: account.code } });
      if (!exists) {
        await this.accountRepository.save(this.accountRepository.create(account));
      }
    }
  }

  private roundCurrency(value: number): number {
    return Math.round(Number(value) * 100) / 100;
  }
}
