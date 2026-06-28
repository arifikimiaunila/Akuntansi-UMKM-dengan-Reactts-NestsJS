# Payroll & Accounting Platform (NestJS + React TS)

Repositori ini sekarang difokuskan untuk sistem gaji karyawan dan akuntansi operasional.

Target pengguna:
- UMKM kaki lima (pembukuan kas sederhana + payroll dasar)
- UMKM berkembang (payroll multi-karyawan + jurnal berpasangan)
- Restoran skala besar / bintang 5 (kontrol biaya SDM + audit trail jurnal)

Struktur utama:
- `nest-backend/`: API payroll, master karyawan, jurnal akuntansi, dashboard ringkasan.
- `react-frontend/`: dashboard operasional untuk HR + akuntansi.
- `legacy-go-beego/`: kode lama berbasis Go/Beego (arsip/migrasi historis).

Upgrade yang sudah aktif:
- persistence database PostgreSQL via TypeORM
- autentikasi JWT + role based access control (owner/admin/finance/hr)
- laporan akuntansi lanjutan: buku besar, trial balance, laba-rugi, neraca

## Menjalankan Backend

1. `cd nest-backend`
2. `npm install`
3. `npm run start:dev`

Backend aktif di `http://localhost:3000/api`.

## Menjalankan Frontend

1. `cd react-frontend`
2. `npm install`
3. `npm run dev`

Frontend memanggil endpoint API pada path `/api/...`.
