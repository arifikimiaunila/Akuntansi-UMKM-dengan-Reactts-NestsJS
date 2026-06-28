import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  CreateEmployeeDto,
  CreateJournalEntryDto,
  PembayaranService,
  RunPayrollDto,
} from '../services/pembayaran.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PembayaranController {
  constructor(private readonly service: PembayaranService) {}

  @Get('employees')
  @Roles('owner', 'admin', 'finance', 'hr')
  findEmployees() {
    return this.service.getEmployees();
  }

  @Post('employees')
  @Roles('owner', 'admin', 'hr')
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.service.createEmployee(dto);
  }

  @Get('payroll')
  @Roles('owner', 'admin', 'finance', 'hr')
  findPayroll() {
    return this.service.getPayrollHistory();
  }

  @Post('payroll/run')
  @Roles('owner', 'admin', 'hr')
  runPayroll(@Body() dto: RunPayrollDto) {
    return this.service.runPayroll(dto);
  }

  @Get('accounting/journals')
  @Roles('owner', 'admin', 'finance')
  findJournals() {
    return this.service.getJournalEntries();
  }

  @Post('accounting/journals')
  @Roles('owner', 'admin', 'finance')
  createJournal(@Body() dto: CreateJournalEntryDto) {
    return this.service.createJournalEntry(dto);
  }

  @Get('accounting/reports/general-ledger')
  @Roles('owner', 'admin', 'finance')
  getGeneralLedger(@Query('accountCode') accountCode?: string) {
    return this.service.getGeneralLedger(accountCode);
  }

  @Get('accounting/reports/trial-balance')
  @Roles('owner', 'admin', 'finance')
  getTrialBalance() {
    return this.service.getTrialBalance();
  }

  @Get('accounting/reports/income-statement')
  @Roles('owner', 'admin', 'finance')
  getIncomeStatement() {
    return this.service.getIncomeStatement();
  }

  @Get('accounting/reports/balance-sheet')
  @Roles('owner', 'admin', 'finance')
  getBalanceSheet() {
    return this.service.getBalanceSheet();
  }

  @Get('dashboard/summary')
  @Roles('owner', 'admin', 'finance', 'hr')
  getSummary() {
    return this.service.getDashboardSummary();
  }
}
