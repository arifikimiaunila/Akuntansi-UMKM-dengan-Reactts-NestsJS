import React, { useState } from 'react';
import api from '../api';

export interface EmployeeOption {
  id: number;
  name: string;
}

interface PayrollFormProps {
  employees: EmployeeOption[];
  onSaved?: (item: any) => void;
}

export default function PembayaranForm({ employees, onSaved }: PayrollFormProps) {
  const [employeeId, setEmployeeId] = useState<number>(employees[0]?.id || 0);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [attendanceDays, setAttendanceDays] = useState(26);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [incentive, setIncentive] = useState(0);
  const [otherDeduction, setOtherDeduction] = useState(0);
  const [notes, setNotes] = useState('Payroll bulanan');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resp = await api.post('/payroll/run', {
      employeeId,
      period,
      attendanceDays,
      overtimeHours,
      incentive,
      otherDeduction,
      notes,
    });
    if (resp.data && resp.data.data) onSaved?.(resp.data.data);
    setOvertimeHours(0);
    setIncentive(0);
    setOtherDeduction(0);
  };

  return (
    <form onSubmit={submit} className="card stack">
      <h3>Run Payroll</h3>
      <label>
        Karyawan
        <select value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))}>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Periode
        <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="YYYY-MM" />
      </label>
      <label>
        Hari Hadir
        <input
          type="number"
          value={attendanceDays}
          onChange={(e) => setAttendanceDays(Number(e.target.value))}
        />
      </label>
      <label>
        Jam Lembur
        <input
          type="number"
          value={overtimeHours}
          onChange={(e) => setOvertimeHours(Number(e.target.value))}
        />
      </label>
      <label>
        Insentif
        <input type="number" value={incentive} onChange={(e) => setIncentive(Number(e.target.value))} />
      </label>
      <label>
        Potongan Lain
        <input
          type="number"
          value={otherDeduction}
          onChange={(e) => setOtherDeduction(Number(e.target.value))}
        />
      </label>
      <label>
        Catatan
        <input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <button type="submit">Proses Payroll</button>
    </form>
  );
}
