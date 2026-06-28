import { Controller, Get } from '@nestjs/common';

@Controller()
export class DefaultController {
  @Get()
  root() {
    return {
      app: 'UMKM Payroll & Accounting API',
      version: '1.0.0',
      modules: [
        'auth-jwt-rbac',
        'employees',
        'payroll',
        'accounting-journal',
        'accounting-reports-ledger-trial-income-balance-sheet',
        'dashboard-summary',
      ],
    };
  }
}
