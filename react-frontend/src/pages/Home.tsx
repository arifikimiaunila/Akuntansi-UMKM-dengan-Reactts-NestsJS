import React, { useEffect, useMemo, useState } from 'react';
import PembayaranForm from '../components/PembayaranForm';
import EmployeeForm from '../components/EmployeeForm';
import JournalForm from '../components/JournalForm';
import api, { setAuthToken } from '../api';

type UserRole = 'owner' | 'admin' | 'finance' | 'hr';

interface SessionUser {
  id: number;
  name: string;
  username: string;
  role: UserRole;
}

interface Employee {
  id: number;
  name: string;
  position: string;
  scale: string;
  baseSalary: number;
}

interface PayrollRecord {
  id: number;
  employeeName: string;
  period: string;
  grossPay: number;
  netPay: number;
  taxAmount: number;
  bpjsAmount: number;
}

interface JournalEntry {
  id: number;
  date: string;
  description: string;
  source: string;
  lines: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
}

interface SummaryResponse {
  metrics: {
    activeEmployees: number;
    payrollRunCount: number;
    payrollOutflowThisPeriod: number;
    totalJournalEntries: number;
    expenseFromJournals: number;
    cashOutFromJournals: number;
  };
  businessReadiness: {
    kakiLima: string[];
    umkm: string[];
    restoBintang5: string[];
  };
}

interface TrialBalanceResponse {
  rows: Array<{
    accountCode: string;
    accountName: string;
    category: string;
    totalDebit: number;
    totalCredit: number;
    balance: number;
  }>;
  totals: {
    debit: number;
    credit: number;
    isBalanced: boolean;
  };
}

interface IncomeStatementResponse {
  totals: {
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
  };
}

interface BalanceSheetResponse {
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
    liabilitiesPlusEquity: number;
  };
}

const tokenKey = 'payroll-app-token';

export default function Home() {
  const [token, setToken] = useState<string | null>(localStorage.getItem(tokenKey));
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loginUsername, setLoginUsername] = useState('owner');
  const [loginPassword, setLoginPassword] = useState('Owner#123');
  const [errorMessage, setErrorMessage] = useState('');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceResponse | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementResponse | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetResponse | null>(null);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }),
    [],
  );

  const canManageEmployees = ['owner', 'admin', 'hr'].includes(user?.role || '');
  const canRunPayroll = ['owner', 'admin', 'hr'].includes(user?.role || '');
  const canAccessFinance = ['owner', 'admin', 'finance'].includes(user?.role || '');

  const loadData = async () => {
    if (!token) {
      return;
    }

    const meRes = await api.get('/auth/me');
    setUser(meRes.data || null);

    const summaryRes = await api.get('/dashboard/summary');
    setSummary(summaryRes.data || null);

    const payrollRes = await api.get('/payroll');
    setPayrolls(payrollRes.data || []);

    const employeeRes = await api.get('/employees');
    setEmployees(employeeRes.data || []);

    if (canAccessFinance || ['owner', 'admin', 'finance'].includes(meRes.data?.role || '')) {
      const [journalsRes, trialRes, incomeRes, balanceRes] = await Promise.all([
        api.get('/accounting/journals'),
        api.get('/accounting/reports/trial-balance'),
        api.get('/accounting/reports/income-statement'),
        api.get('/accounting/reports/balance-sheet'),
      ]);
      setJournals(journalsRes.data || []);
      setTrialBalance(trialRes.data || null);
      setIncomeStatement(incomeRes.data || null);
      setBalanceSheet(balanceRes.data || null);
    } else {
      setJournals([]);
      setTrialBalance(null);
      setIncomeStatement(null);
      setBalanceSheet(null);
    }
  };

  useEffect(() => {
    setAuthToken(token);
    if (token) {
      loadData().catch(() => {
        setErrorMessage('Session tidak valid, silakan login ulang.');
        logout();
      });
    }
  }, [token]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const response = await api.post('/auth/login', {
      username: loginUsername,
      password: loginPassword,
    });

    if (response.data?.error) {
      setErrorMessage(response.data.error);
      return;
    }

    const accessToken = response.data?.data?.accessToken;
    if (!accessToken) {
      setErrorMessage('Gagal mendapatkan token login.');
      return;
    }

    localStorage.setItem(tokenKey, accessToken);
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setEmployees([]);
    setPayrolls([]);
    setJournals([]);
    setSummary(null);
    setTrialBalance(null);
    setIncomeStatement(null);
    setBalanceSheet(null);
  };

  if (!token) {
    return (
      <div className="page login-page">
        <section className="card login-card stack">
          <p className="eyebrow">Secure Login</p>
          <h1>Masuk ke Payroll & Accounting Suite</h1>
          <p>Akun default: owner / Owner#123, admin / Admin#123, finance / Finance#123, hr / Hr#12345</p>
          <form onSubmit={login} className="stack">
            <label>
              Username
              <input value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </label>
            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
            <button type="submit">Login</button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="hero card">
        <div className="header-row">
          <div>
            <p className="eyebrow">Payroll + Accounting Suite</p>
            <h1>Platform Akuntansi untuk UMKM Kaki Lima sampai Resto Bintang 5</h1>
            <p>
              Kelola karyawan, proses payroll, posting jurnal, dan pantau laporan keuangan terstruktur.
            </p>
          </div>
          <div className="session-box">
            <p>
              Login sebagai: <strong>{user?.name || '-'}</strong>
            </p>
            <p>
              Role: <strong>{user?.role || '-'}</strong>
            </p>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <section className="metrics-grid">
        <article className="card metric-card">
          <span>Karyawan Aktif</span>
          <strong>{summary?.metrics.activeEmployees ?? 0}</strong>
        </article>
        <article className="card metric-card">
          <span>Payroll Diproses</span>
          <strong>{summary?.metrics.payrollRunCount ?? 0}</strong>
        </article>
        <article className="card metric-card">
          <span>Outflow Payroll Periode Ini</span>
          <strong>{currency.format(summary?.metrics.payrollOutflowThisPeriod ?? 0)}</strong>
        </article>
        <article className="card metric-card">
          <span>Total Jurnal</span>
          <strong>{summary?.metrics.totalJournalEntries ?? 0}</strong>
        </article>
      </section>

      <section className="forms-grid">
        {canManageEmployees ? (
          <EmployeeForm
            onSaved={(item) => {
              setEmployees((prev) => [item, ...prev]);
              loadData();
            }}
          />
        ) : (
          <article className="card empty-card">Role saat ini tidak bisa menambah karyawan.</article>
        )}

        {canRunPayroll ? (
          <PembayaranForm
            employees={employees.map((employee) => ({ id: employee.id, name: employee.name }))}
            onSaved={(item) => {
              setPayrolls((prev) => [item, ...prev]);
              loadData();
            }}
          />
        ) : (
          <article className="card empty-card">Role saat ini tidak bisa menjalankan payroll.</article>
        )}

        {canAccessFinance ? (
          <JournalForm
            onSaved={(item) => {
              setJournals((prev) => [item, ...prev]);
              loadData();
            }}
          />
        ) : (
          <article className="card empty-card">Role saat ini tidak bisa posting jurnal manual.</article>
        )}
      </section>

      <section className="content-grid">
        <article className="card">
          <h2>Master Karyawan</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Posisi</th>
                  <th>Skala</th>
                  <th>Gaji Pokok</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.position}</td>
                    <td>{employee.scale}</td>
                    <td>{currency.format(employee.baseSalary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <h2>Riwayat Payroll</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Periode</th>
                  <th>Gross</th>
                  <th>Net</th>
                  <th>Pajak + BPJS</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => (
                  <tr key={payroll.id}>
                    <td>{payroll.employeeName}</td>
                    <td>{payroll.period}</td>
                    <td>{currency.format(payroll.grossPay)}</td>
                    <td>{currency.format(payroll.netPay)}</td>
                    <td>{currency.format(payroll.taxAmount + payroll.bpjsAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {canAccessFinance ? (
        <section className="content-grid single-column">
          <article className="card">
            <h2>Jurnal Terbaru</h2>
            <div className="journal-list">
              {journals.slice(0, 10).map((entry) => (
                <div key={entry.id} className="journal-item">
                  <div className="journal-head">
                    <strong>
                      {entry.date} - {entry.description}
                    </strong>
                    <span className="badge">{entry.source}</span>
                  </div>
                  <ul>
                    {entry.lines.map((line, index) => (
                      <li key={`${entry.id}-${index}`}>
                        {line.accountCode} {line.accountName} | D: {currency.format(line.debit)} | K:{' '}
                        {currency.format(line.credit)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>

          <article className="card">
            <h2>Laporan Akuntansi</h2>
            <div className="report-grid">
              <div className="report-box">
                <h4>Trial Balance</h4>
                <p>Total Debit: {currency.format(trialBalance?.totals.debit || 0)}</p>
                <p>Total Kredit: {currency.format(trialBalance?.totals.credit || 0)}</p>
                <p>Status: {trialBalance?.totals.isBalanced ? 'Balanced' : 'Belum Seimbang'}</p>
              </div>
              <div className="report-box">
                <h4>Laba Rugi</h4>
                <p>Pendapatan: {currency.format(incomeStatement?.totals.totalRevenue || 0)}</p>
                <p>Beban: {currency.format(incomeStatement?.totals.totalExpense || 0)}</p>
                <p>Laba Bersih: {currency.format(incomeStatement?.totals.netIncome || 0)}</p>
              </div>
              <div className="report-box">
                <h4>Neraca</h4>
                <p>Aset: {currency.format(balanceSheet?.totals.assets || 0)}</p>
                <p>Liabilitas: {currency.format(balanceSheet?.totals.liabilities || 0)}</p>
                <p>Ekuitas: {currency.format(balanceSheet?.totals.equity || 0)}</p>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <section className="content-grid single-column">
        <article className="card readiness">
          <h2>Roadmap Fitur Berdasarkan Skala Bisnis</h2>
          <div className="readiness-grid">
            <div>
              <h4>Kaki Lima</h4>
              <ul>
                {(summary?.businessReadiness.kakiLima || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>UMKM</h4>
              <ul>
                {(summary?.businessReadiness.umkm || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Resto Bintang 5</h4>
              <ul>
                {(summary?.businessReadiness.restoBintang5 || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
