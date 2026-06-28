import React, { useState } from 'react';
import api from '../api';

interface EmployeeFormProps {
  onSaved?: (item: any) => void;
}

export default function EmployeeForm({ onSaved }: EmployeeFormProps) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [scale, setScale] = useState('umkm');
  const [baseSalary, setBaseSalary] = useState(3500000);
  const [taxPercent, setTaxPercent] = useState(2);
  const [bankAccount, setBankAccount] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await api.post('/employees', {
      name,
      position,
      scale,
      baseSalary,
      taxPercent,
      bankAccount,
    });

    if (response.data?.data) {
      onSaved?.(response.data.data);
      setName('');
      setPosition('');
      setBankAccount('');
    }
  };

  return (
    <form onSubmit={submit} className="card stack">
      <h3>Tambah Karyawan</h3>
      <label>
        Nama
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Posisi
        <input value={position} onChange={(e) => setPosition(e.target.value)} required />
      </label>
      <label>
        Skala Bisnis
        <select value={scale} onChange={(e) => setScale(e.target.value)}>
          <option value="kaki-lima">Kaki Lima</option>
          <option value="umkm">UMKM</option>
          <option value="resto-bintang-5">Resto Bintang 5</option>
        </select>
      </label>
      <label>
        Gaji Pokok
        <input
          type="number"
          value={baseSalary}
          onChange={(e) => setBaseSalary(Number(e.target.value))}
          required
        />
      </label>
      <label>
        Pajak (%)
        <input
          type="number"
          value={taxPercent}
          onChange={(e) => setTaxPercent(Number(e.target.value))}
          required
        />
      </label>
      <label>
        Rekening Bank
        <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required />
      </label>
      <button type="submit">Simpan Karyawan</button>
    </form>
  );
}
