# 🚀 ProtekSales Backend REST API Server

Backend RESTful API untuk **Sistem Manajemen Prospek, Outlet, & Komisi Sales** yang dibangun mengikuti spesifikasi dokumen `Blueprint.txt`.

---

## 🛠️ Teknologi & Versi

- **Runtime & Bahasa**: Node.js & TypeScript (`v5.5.4`)
- **Development Tool**: `ts-node-dev` (Hot-reload development server)
- **Web Framework**: Express.js (`v4.19.2`)
- **Database & ORM**: PostgreSQL & Prisma ORM (`v5.19.0`)
- **Driver Database**: `pg` (`v8.23.0`)
- **Libraries**:
  - `cors` (`v2.8.5`) - Penanganan CORS untuk frontend / mobile
  - `dotenv` (`v16.4.5`) - Manajemen environment variables
  - `jsonwebtoken` - Autentikasi JWT Bearer token
  - `bcryptjs` - Enkripsi password akun
  - `node-cron` - Penjadwal otomatis untuk pembersihan prospek kadaluwarsa & kill-switch

---

## 📁 Struktur Direktori

```
BE/
├── prisma/
│   ├── schema.prisma         # Skema database PostgreSQL lengkap
│   └── seed.ts               # Data awal (Admin, Sales, Prospek, Outlet, Invoice, Lisensi)
├── src/
│   ├── config/
│   │   ├── env.ts            # Validasi konfigurasi & environment variable
│   │   └── prisma.ts         # Singleton client Prisma ORM
│   ├── constants/            # Enum status (Lead, Invoice, License, Commission)
│   ├── controllers/
│   │   ├── admin.controller.ts       # Kontrol Admin, Approval finansial, Sengketa, Saklar
│   │   ├── auth.controller.ts        # Login, Registrasi, Profil Sales/Admin
│   │   ├── commission.controller.ts  # Dompet komisi, riwayat, permohonan penarikan (withdraw)
│   │   ├── invoice.controller.ts     # Manajemen invoice, upload bukti bayar, link WA
│   │   ├── lead.controller.ts        # Cek & kunci prospek, check-in kunjungan, pipeline
│   │   ├── license.controller.ts     # Heartbeat ping POS & kill-switch
│   │   └── outlet.controller.ts      # Daftar klien aktif, onboarding POS
│   ├── jobs/
│   │   └── scheduler.ts      # Cron Job harian (Kedaluwarsa 30 hari & Auto-Lock Overdue)
│   ├── middlewares/
│   │   ├── auth.middleware.ts        # Validasi JWT Bearer Token
│   │   ├── error.middleware.ts       # Global error handler & 404 handler
│   │   └── role.middleware.ts        # Role-based access control (ADMIN / SALES)
│   ├── routes/
│   │   ├── admin.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── commission.routes.ts
│   │   ├── index.ts                  # Agregator router utama (/api)
│   │   ├── invoice.routes.ts
│   │   ├── lead.routes.ts
│   │   ├── license.routes.ts
│   │   └── outlet.routes.ts
│   ├── services/
│   │   ├── billing.service.ts        # Logika invoice, jatuh tempo & suspensi
│   │   ├── commission.service.ts     # Recurring Commission Engine & Dompet Saldo
│   │   ├── lead.service.ts           # Lead Locking Engine (Anti-Bentrok Prospek)
│   │   └── license.service.ts        # Remote Kill-Switch Engine (POS Heartbeat)
│   ├── utils/
│   │   ├── jwt.ts                    # Helper pembuatan & verifikasi JWT
│   │   ├── phoneSanitizer.ts         # Normalisasi nomor WA ke standar internasional 628...
│   │   └── response.ts               # Standarisasi response JSON API
│   └── index.ts                      # Entrypoint server Express
├── .env.example
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Panduan Menjalankan Backend

### 1. Konfigurasi Environment (`.env`)
Salin file `.env.example` ke `.env` dan sesuaikan koneksi database PostgreSQL Anda:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/protek_sales?schema=public"
JWT_SECRET="protek_super_secret_jwt_key_2026_xyz"
JWT_EXPIRES_IN="7d"
LEAD_PROTECTION_DAYS=30
DEFAULT_COMMISSION_PERCENTAGE=25
MINIMUM_WITHDRAWAL_AMOUNT=100000
INVOICE_GRACE_PERIOD_DAYS=3
```

### 2. Generate Prisma Client & Migrasi Database
```bash
# Generate client ORM
npm run prisma:generate

# Jalankan migrasi skema database (membuat tabel di PostgreSQL)
npx prisma migrate dev --name init_protek_schema
```

### 3. Jalankan Database Seeding (Data Percobaan Awal)
```bash
npm run prisma:seed
```
Akun bawaan hasil seeding:
- **Admin**: `admin@protek.id` / Password: `password123`
- **Sales A**: `budi.sales@protek.id` / Password: `password123`
- **Sales B**: `rian.sales@protek.id` / Password: `password123`

### 4. Menjalankan Server Development
```bash
npm run dev
```
Server akan aktif di: `http://localhost:5000/api`

---

## 📡 Dokumentasi Endpoint API (Untuk Tim Android / Frontend)

Semua endpoint dilindungi header:
```http
Authorization: Bearer <TOKEN_JWT>
Content-Type: application/json
```
*(Kecuali endpoint Login/Register dan Heartbeat POS yang bersifat publik)*

### 1. Autentikasi (`/api/auth`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/auth/login` | Login user (Sales atau Admin). Mengembalikan user info & Bearer JWT token |
| `POST` | `/api/auth/register` | Mendaftarkan sales baru |
| `GET` | `/api/auth/profile` | Mengambil profil user yang sedang login |
| `PUT` | `/api/auth/bank-info` | Update data rekening bank sales untuk pencairan komisi |

---

### 2. Cek & Kunci Prospek / Pipeline Sales (`/api/leads`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/leads/check?phone=081234567890` | **Anti-Bentrok Prospek**: Cek apakah toko/nomor WA bebas atau sedang diklaim sales lain |
| `POST` | `/api/leads/check-in` | **Form Check-in**: Pendaftaran kunjungan baru, otomatis mengunci toko selama 30 hari |
| `GET` | `/api/leads?status=NEW&search=Berkah` | Mengambil daftar prospek sales aktif (bisa filter status: `NEW`, `DEMO`, `DEAL`, `LOST`, `EXPIRED`) |
| `GET` | `/api/leads/:id` | Detail prospek beserta linimasa riwayat kunjungan |
| `PATCH`| `/api/leads/:id/status` | Update tahapan pipeline prospek (`NEW` -> `DEMO` -> `DEAL` -> `LOST`) |
| `POST` | `/api/leads/:id/visits` | Menambahkan catatan log kunjungan lanjutan |
| `POST` | `/api/leads/:id/dispute` | Mengajukan sengketa klaim prospek jika terjadi sengketa antarsales |

---

### 3. Klien Aktif & Onboarding Outlet (`/api/outlets`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/outlets` | Daftar outlet binaan sales dengan status pembayaran realtime (`PAID`, `DUE_SOON`, `OVERDUE`) |
| `GET` | `/api/outlets/:id` | Detail lengkap outlet, kunci lisensi POS, dan riwayat tagihannya |
| `POST` | `/api/outlets` | Onboarding outlet baru (dari prospek yang sudah `DEAL`), otomatis membuat lisensi POS |

---

### 4. Dompet Komisi Sales (`/api/commissions`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/commissions/wallet` | Ringkasan saldo: Siap Ditarik (`readyBalance`), Tertahan (`pendingCommission`), & Sudah Ditarik |
| `GET` | `/api/commissions/history` | Riwayat komisi masuk dari tagihan langganan outlet yang lunas |
| `POST` | `/api/commissions/withdraw` | Form penarikan saldo komisi ke rekening bank (Min: Rp 100.000) |
| `GET` | `/api/commissions/withdrawals` | Riwayat permohonan penarikan dana beserta status persetujuan admin |

---

### 5. Tagihan & Bukti Bayar (`/api/invoices`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/invoices` | Daftar seluruh invoice tagihan langganan |
| `POST` | `/api/invoices` | Penerbitan tagihan manual untuk outlet |
| `POST` | `/api/invoices/:id/payment-proof` | Upload URL bukti transfer pembayaran tagihan dari pemilik toko |
| `GET` | `/api/invoices/:id/reminder-link` | Dapatkan teks pesan tagihan & link `wa.me` langsung ke nomor WA toko |

---

### 6. Performa Sales, Leaderboard, & Tools (`/api/sales`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/sales/leaderboard` | Papan peringkat performa & insentif sales (ranking deals & total komisi) |
| `GET` | `/api/sales/kpi` | Profil performa KPI sales, closing rate, total kunjungan, & progres tier komisi (Silver, Gold, Platinum) |
| `GET` | `/api/sales/routes-map` | Data koordinat GPS seluruh prospek sales untuk optimasi rute kunjungan di lapangan |
| `POST` | `/api/sales/roi-calculator` | Kalkulator ROI simulasi potensi keuntungan & penghematan kebocoran kas untuk presentasi ke pemilik toko |

---

### 7. Remote Kill-Switch API (`/api/license`)
*Endpoint ini dipanggil oleh aplikasi Kasir/POS Outlet saat aplikasi dibuka atau pergantian hari:*

#### `POST /api/license/heartbeat` (Publik)
**Request Body:**
```json
{
  "licenseKey": "PROPOS-KP01-LIVE",
  "machineId": "DEVICE-ANDROID-POS-01"
}
```
**Respon Normal (Aktif):**
```json
{
  "success": true,
  "message": "Aplikasi operasional normal.",
  "data": {
    "status": "ACTIVE",
    "canOperate": true,
    "outlet": {
      "id": "uuid...",
      "name": "Kedai Kopi Bahagia"
    },
    "licenseKey": "PROPOS-KP01-LIVE"
  }
}
```
**Respon Terkunci (Overdue / Saklar Dimatikan):**
```json
{
  "success": true,
  "message": "Akses transaksi dikunci. Tagihan periode September 2026 belum lunas...",
  "data": {
    "status": "SUSPENDED",
    "canOperate": false,
    "invoiceStatus": "OVERDUE",
    "overdueInvoice": {
      "invoiceNumber": "INV-20260901",
      "amount": 150000,
      "billingPeriod": "September 2026"
    },
    "paymentInfo": {
      "bankName": "BCA",
      "accountNumber": "8830192831",
      "accountHolder": "PT PRO TEKNOLOGI INDONESIA"
    }
  }
}
```

---

### 7. Pusat Kontrol Admin (`/api/admin`) *(Role: ADMIN)*
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/admin/metrics` | Ringkasan metrik dashboard (Total sales, lead, outlet, tagihan menunggak, penarikan pending) |
| `GET` | `/api/admin/leads/map` | Peta sebaran dan histori seluruh prospek lintas sales |
| `POST` | `/api/admin/invoices/:id/verify` | **Verifikasi Bukti Transfer**: Ubah invoice ke `PAID` & otomatis terbitkan komisi sales |
| `POST` | `/api/admin/withdrawals/:id/process` | **Approval Payout**: Setujui (`COMPLETED`) atau tolak permohonan penarikan dana sales |
| `POST` | `/api/admin/licenses/:id/toggle` | **Saklar Lisensi Remote**: Matikan (`SUSPENDED`) atau nyalakan (`ACTIVE`) akses POS secara remote |
| `GET` | `/api/admin/disputes` | Daftar permohonan banding sengketa klaim toko antarsales |
| `POST` | `/api/admin/disputes/:id/resolve` | Selesaikan sengketa: alihkan kepemilikan toko atau tolak klaim |
| `GET` | `/api/admin/sales` | Daftar seluruh sales, data performa jumlah outlet & rekening bank |

---

## ⏰ Cron Jobs Otomatis

1. **Daily 00:00 (Pembersihan Prospek 30 Hari)**:
   - Mengecek seluruh prospek yang belum `DEAL` dan telah melewati batas `protectedUntil`.
   - Otomatis mengubah status menjadi `EXPIRED`, sehingga toko kembali bebas untuk dikunjungi sales lain.
2. **Daily 01:00 (Otomatisasi Saklar Overdue)**:
   - Mengecek tagihan `UNPAID` yang melewati tanggal jatuh tempo ditambah batas toleransi (grace period 3 hari).
   - Mengubah status tagihan menjadi `OVERDUE` dan otomatis mengubah status lisensi outlet menjadi `SUSPENDED`.
