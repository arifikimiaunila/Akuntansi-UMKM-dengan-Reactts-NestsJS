import React, { useState } from 'react';
import api from '../api';

const accountOptions = [
  { code: '1101', name: 'Kas dan Bank' },
  { code: '2101', name: 'Utang Pajak Karyawan' },
  { code: '2102', name: 'Utang BPJS' },
  { code: '2103', name: 'Utang Potongan Lain' },
  { code: '5101', name: 'Beban Gaji' },
  { code: '5102', name: 'Beban Tunjangan dan Lembur' },
];

interface JournalFormProps {
  onSaved?: (item: any) => void;
}

export default function JournalForm({ onSaved }: JournalFormProps) {
  const [description, setDescription] = useState('Penyesuaian operasional');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [debitCode, setDebitCode] = useState('5101');
  const [creditCode, setCreditCode] = useState('1101');
  const [amount, setAmount] = useState(250000);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await api.post('/accounting/journals', {
      date,
      description,
      lines: [
        { accountCode: debitCode, debit: amount, credit: 0 },
        { accountCode: creditCode, debit: 0, credit: amount },
      ],
    });

    if (response.data?.data) {
      onSaved?.(response.data.data);
      setAmount(250000);
    }
  };

  return (
    <form onSubmit={submit} className="card stack">
      <h3>Jurnal Manual Cepat</h3>
      <label>
        Tanggal
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label>
        Deskripsi
        <input value={description} onChange={(e) => setDescription(e.target.value)} required />
      </label>
      <label>
        Akun Debit
        <select value={debitCode} onChange={(e) => setDebitCode(e.target.value)}>
          {accountOptions.map((account) => (
            <option key={account.code} value={account.code}>
              {account.code} - {account.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Akun Kredit
        <select value={creditCode} onChange={(e) => setCreditCode(e.target.value)}>
          {accountOptions.map((account) => (
            <option key={account.code} value={account.code}>
              {account.code} - {account.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Nominal
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      </label>
      <button type="submit">Posting Jurnal</button>
    </form>
  );
}
