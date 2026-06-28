NestJS backend untuk sistem payroll dan akuntansi.

Quick start:

1. `cd nest-backend`
2. `npm install`
3. `npm run start:dev`

Base URL:

- `http://localhost:3000/api`

Konfigurasi environment PostgreSQL (opsional, default sudah disediakan):

- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`
- `DB_NAME=gaji_akuntansi`
- `JWT_SECRET=dev-secret-key-change-me`

Jika ingin cepat coba lokal, buat database PostgreSQL kosong bernama `gaji_akuntansi`.

Mode database:

- Default tanpa env `DB_TYPE`: menggunakan database embedded (`sqljs`) sehingga backend bisa langsung jalan tanpa instal PostgreSQL.
- Jika ingin PostgreSQL penuh: set `DB_TYPE=postgres` lalu isi `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`.

Autentikasi:

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me` (Bearer token)

Akun seed default:

- owner / Owner#123
- admin / Admin#123
- finance / Finance#123
- hr / Hr#12345

API utama:

- `GET /` -> metadata aplikasi
- `GET /employees` -> daftar karyawan
- `POST /employees` -> tambah karyawan
- `GET /payroll` -> riwayat payroll
- `POST /payroll/run` -> proses payroll karyawan
- `GET /accounting/journals` -> daftar jurnal
- `POST /accounting/journals` -> posting jurnal manual
- `GET /accounting/reports/general-ledger` -> buku besar
- `GET /accounting/reports/trial-balance` -> neraca saldo
- `GET /accounting/reports/income-statement` -> laporan laba rugi
- `GET /accounting/reports/balance-sheet` -> neraca
- `GET /dashboard/summary` -> ringkasan metrik dan kesiapan skala bisnis

Semua endpoint bisnis (selain auth dan root) menggunakan JWT + role based access control.
