# EventHub Kampus (Universitas Negeri Padang)
**Platform Terpusat Informasi Kegiatan, Lomba, dan Event Kampus**

EventHub Kampus adalah platform informasi kegiatan akademik dan non-akademik mahasiswa di lingkungan kampus Universitas Negeri Padang (UNP). Aplikasi ini bertujuan untuk memusatkan informasi lomba, seminar, workshop, beasiswa, seni budaya, dan olahraga agar mahasiswa dapat dengan mudah menemukan event serta merencanakan jadwal kegiatan mereka, sekaligus memudahkan penyelenggara/organisasi kampus dalam mengelola informasi event.

---

## 1. Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan arsitektur modern berbasis web:

* **Frontend:**
  * **Framework:** Next.js 16 (App Router dengan Turbopack)
  * **Library UI:** React 19
  * **Bahasa:** TypeScript
  * **Styling:** Tailwind CSS v4
* **Backend:**
  * **Mekanisme API:** Next.js Route Handlers (`app/api/events/*`)
  * **Arsitektur:** REST API terpisah dari logika bisnis melalui *Service Layer* (`lib/services/event-service.ts`)
* **Database:**
  * **Database Server:** PostgreSQL Server eksternal (teruji pada PostgreSQL 17 Cloud Supabase dan PostgreSQL 16 Docker Server)
  * **Driver:** Pustaka resmi `pg` (node-postgres) dengan *Connection Pooling* otomatis
  * **Keamanan Kueri:** *Parameterized SQL Queries* (`$1, $2, ...`) untuk mencegah SQL Injection

> **Catatan Ketergantungan Database:** Seluruh ketergantungan database lokal embedded (`@electric-sql/pglite`) telah dihapus. Database berjalan sebagai layanan mandiri terpisah melalui jaringan TCP.

---

## 2. Fitur dan Status Implementasi

Implementasi fitur pada repositori ini dibedakan secara tegas antara antarmuka (UI), backend API, dan database:

| Fitur | Cakupan Frontend (UI) | Cakupan Backend (API) | Cakupan Database | Status Alur End-to-End |
| :--- | :---: | :---: | :---: | :--- |
| **Beranda (Home)** | Menampilkan pencarian, event terpopuler, terbaru, dan kategori dinamis | Terhubung via `apiGetEvents()` | `SELECT` dari tabel `events` | **Selesai dan terverifikasi** |
| **Eksplorasi Event** | Grid event, filter kategori, harga (gratis/berbayar), lokasi, dan sorting | Terhubung dengan filter query parameters | Query dinamis dengan klausa `WHERE` & `ORDER BY` | **Selesai dan terverifikasi** |
| **Pencarian Event** | Form pencarian live di Beranda dan Halaman Event | Terhubung via parameter `search` | Case-insensitive pattern matching (`ILIKE`) | **Selesai dan terverifikasi** |
| **Detail Event** | Menampilkan deskripsi lengkap, persyaratan (JSONB), kuota, dan kontak | Terhubung via `apiGetEventById()` | `SELECT WHERE id = $1` | **Selesai dan terverifikasi** |
| **Kalender Event** | Grid kalender bulanan dengan dot indicator dan panel event harian | Terhubung via `apiGetEvents()` | Pemetaan tanggal event ke tanggal kalender | **Selesai dan terverifikasi** |
| **Dashboard Admin (CRUD Event)** | Panel admin: formulir tambah event, modal edit, dan hapus event | Terhubung ke endpoint `POST`, `PATCH`, dan `DELETE` | `INSERT`, `UPDATE`, `DELETE` ke tabel `events` | **Selesai dan terverifikasi** |
| **Pendaftaran Tiket Event** | Modal konfirmasi tiket dan kode tiket otomatis (`EVT-XXXXXX`) | Belum ada endpoint API pendaftaran | Belum ada tabel registrasi pendaftar | **Sebagian selesai (Simulasi Client)** |
| **Profil Pengguna** | Tampilan info profil, tab tiket, reminder, dan event tersimpan | Tab event tersimpan mengambil data dari API | Profil dan tiket belum terhubung ke database | **Sebagian selesai** |
| **Login & Registrasi User** | Formulir login dan pendaftaran akun | Belum ada endpoint `/api/auth/*` | Belum ada tabel `users` | **Sebagian selesai (Simulasi Client)** |
| **Proteksi Rute Admin** | Tampilan navigasi sidebar admin | Belum ada middleware proteksi rute | Belum ada token/session auth | **Belum diimplementasikan** |

---

## 3. Arsitektur Aplikasi dan Struktur Direktori

### Diagram Alir Komunikasi Data
```
┌─────────────────────────────────────────────────────────┐
│              Frontend Pages & Components                │
│ (Home, Event List, Detail, Kalender, Dashboard Admin)   │
└────────────────────────────┬────────────────────────────┘
                             │ Client Fetch Wrapper (lib/api.ts)
                             ▼
┌─────────────────────────────────────────────────────────┐
│             Next.js 16 REST Route Handlers              │
│       (app/api/events/route.ts, [id]/route.ts)          │
└────────────────────────────┬────────────────────────────┘
                             │ Business Logic & Validation
                             ▼
┌─────────────────────────────────────────────────────────┐
│           Service Layer: lib/services/event-service.ts  │
│        (Validasi DTO, Parameterized SQL Builder)        │
└────────────────────────────┬────────────────────────────┘
                             │ Database Connection Layer
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Database Layer: lib/db.ts                 │
│         (pg.Pool, SSL Auto-detect, Schema Init)         │
└────────────────────────────┬────────────────────────────┘
                             │ TCP Network Socket (DATABASE_URL)
                             ▼
┌─────────────────────────────────────────────────────────┐
│         PostgreSQL Database Server (Eksternal)          │
│   (Cloud Supabase / Neon / Docker Compose / Lokal)      │
└─────────────────────────────────────────────────────────┘
```

### Struktur Folder Utama
```
eventhub/
├── app/
│   ├── api/
│   │   └── events/
│   │       ├── route.ts              # REST API GET (daftar/filter) & POST (tambah event)
│   │       └── [id]/
│   │           └── route.ts          # REST API GET (detail), PATCH/PUT (edit), DELETE
│   ├── dashboard/
│   │   ├── layout.tsx                # Layout panel admin dengan AdminSidebar
│   │   └── page.tsx                  # Antarmuka manajemen CRUD event admin
│   ├── event/
│   │   ├── page.tsx                  # Halaman eksplorasi & filter event lengkap
│   │   └── [id]/
│   │       └── page.tsx              # Halaman detail event & modal pendaftaran tiket
│   ├── kalender/
│   │   └── page.tsx                  # Kalender bulanan event kampus
│   ├── login/
│   │   └── page.tsx                  # Form login (simulasi peramban)
│   ├── register/
│   │   └── page.tsx                  # Form registrasi (simulasi peramban)
│   ├── profil/
│   │   └── page.tsx                  # Profil mahasiswa & tab event tersimpan
│   ├── layout.tsx                    # Root layout (Navbar, Footer, AuthProvider)
│   ├── page.tsx                      # Beranda aplikasi
│   └── globals.css                   # Konfigurasi Tailwind CSS
├── components/
│   ├── AdminSidebar.tsx              # Sidebar navigasi panel admin
│   ├── EventCard.tsx                 # Kartu tampilan ringkas event
│   ├── Footer.tsx                    # Footer aplikasi
│   └── Navbar.tsx                    # Navigasi utama & indikator status user
├── context/
│   └── AuthContext.tsx               # Client React Context untuk simulasi status login
├── lib/
│   ├── api.ts                        # Client API wrapper pemanggilan fetch backend
│   ├── db.ts                         # Connection pool PostgreSQL, SSL, init skema
│   ├── mock-data.ts                  # Data seed awal dan mock profil
│   └── services/
│       └── event-service.ts          # Business logic, query builder SQL, validasi DTO
├── scripts/
│   ├── init-db.ts                    # Inisialisasi skema tabel database (npm run db:init)
│   ├── seed.ts                       # Seeding 6 data event awal (npm run db:seed)
│   └── test-integration.ts           # 26 skenario pengujian otomatis (npm run test:integration)
├── types/
│   └── index.ts                      # Definisi tipe data TypeScript (Event, User, dll.)
├── docker-compose.yml                # Layanan container PostgreSQL 16 server
├── .env.example                      # Template variabel lingkungan
└── package.json                      # Dependency dan skrip eksekusi
```

---

## 4. Prasyarat Instalasi

Sebelum menjalankan aplikasi, pastikan perangkat Anda memiliki:

1. **Node.js:** Versi 20.x atau 24.x LTS.
2. **Package Manager:** `npm` (bawaan Node.js).
3. **PostgreSQL Database Server:** Pilih salah satu dari opsi berikut:
   * **Docker & Docker Compose** (jika ingin menjalankan PostgreSQL lokal tanpa instalasi manual).
   * **PostgreSQL Server Lokal** (instalasi manual PostgreSQL 14/15/16/17 pada host).
   * **Cloud PostgreSQL Provider** (misal: Supabase, Neon, atau Railway).

---

## 5. Panduan Menjalankan Proyek

Ikuti langkah-langkah berikut untuk menjalankan proyek dari awal:

### Langkah 1: Clone Repository dan Masuk Direktori
```bash
git clone <URL_REPOSITORY>
cd eventhub
```

### Langkah 2: Instalasi Dependency
```bash
npm install
```

### Langkah 3: Konfigurasi Environment Variable
Salin template konfigurasi `.env.example` menjadi `.env.local`:
```bash
# Windows PowerShell:
Copy-Item .env.example .env.local

# Linux / macOS:
cp .env.example .env.local
```
Buka `.env.local` dan sesuaikan nilai `DATABASE_URL` dengan database Anda.

### Langkah 4: Menyiapkan Database Server
Pilih salah satu metode berikut:

* **Opsi A: Menggunakan Docker Compose (Lokal)**
  ```bash
  docker compose up -d
  ```
  *Service PostgreSQL akan aktif di port `5432` dengan database `eventhub`.*

* **Opsi B: Menggunakan Service PostgreSQL Lokal**
  Pastikan service PostgreSQL di komputer Anda aktif dan database target sudah dibuat:
  ```sql
  CREATE DATABASE eventhub;
  ```

* **Opsi C: Menggunakan Cloud PostgreSQL (Supabase / Neon)**
  Gunakan connection string yang disediakan dashboard cloud pada `DATABASE_URL`, serta set `DB_SSL=true`:
  ```env
  DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
  DB_SSL=true
  ```

### Langkah 5: Inisialisasi Skema Tabel (Migration)
Jalankan skrip inisialisasi untuk membuat tabel `events` dan indeksnya:
```bash
npm run db:init
```

### Langkah 6: Seeding Data Awal
Masukkan 6 data kegiatan awal UNP ke dalam database:
```bash
npm run db:seed
```
*Skrip ini bersifat idempoten (dapat dijalankan berulang tanpa menduplikasi data).*

### Langkah 7: Menjalankan Automated Integration Test
Pastikan integrasi database dan API berfungsi 100%:
```bash
npm run test:integration
```

### Langkah 8: Menjalankan Aplikasi (Development Mode)
```bash
npm run dev
```
Buka peramban dan akses: [http://localhost:3000](http://localhost:3000)

### Langkah 9: Verifikasi Kode (Linting & Production Build)
Untuk memastikan tidak ada kesalahan tipe atau sintaks:
```bash
npm run lint
npm run build
```

---

## 6. Dokumentasi REST API

Backend API Next.js Route Handlers tersedia pada basis rute `/api/events`.

> [!WARNING]
> **Catatan Keamanan & Hak Akses:**
> Endpoint mutasi data (`POST`, `PATCH`, `PUT`, `DELETE`) saat ini **belum dilengkapi dengan proteksi autentikasi token/session**. Siapa pun yang mengirimkan HTTP request ke endpoint tersebut dapat memodifikasi data. Proteksi middleware dan verifikasi otorisasi admin merupakan prioritas pekerjaan berikutnya.

### 1. `GET /api/events`
* **Fungsi:** Mengambil daftar event dengan dukungan pemfilteran dan pencarian.
* **Query Parameters (Opsional):**
  * `category` *(string)*: Filter kategori (misal: `Seminar`, `Workshop`, `Lomba`, dll.).
  * `search` *(string)*: Pencarian kata kunci pada judul, deskripsi, atau penyelenggara.
  * `price` *(string)*: `gratis` (harga = 0) atau `berbayar` (harga > 0).
  * `location` *(string)*: `online` (daring) atau `offline` (luring).
  * `status` *(string)*: `active`, `draft`, `completed`, atau `cancelled`.
  * `sortBy` *(string)*: `terbaru` (tanggal terbaru), `populer` (populer & peserta terbanyak), `harga-rendah` (harga termurah).
* **Respons Berhasil:** `HTTP 200 OK`
  ```json
  [
    {
      "id": "1",
      "title": "AI Revolution: Transformasi Digital Kampus Masa Depan",
      "description": "Seminar nasional teknologi...",
      "date": "2026-10-28",
      "time": "09:00 - 13:00 WIB",
      "location": "Auditorium Utama Gedung Rektorat",
      "category": "Seminar",
      "image": "https://...",
      "price": 0,
      "organizer": "BEM Fakultas Ilmu Komputer",
      "quota": 200,
      "registeredCount": 155,
      "status": "active",
      "requirements": ["Mahasiswa aktif...", "Membawa laptop..."],
      "contactPic": "+62 812-3456-7890",
      "isPopular": true
    }
  ]
  ```
* **Respons Error:** `HTTP 500 Internal Server Error` (jika koneksi database terputus).

---

### 2. `POST /api/events`
* **Fungsi:** Membuat data event baru di database.
* **Request Body (JSON):**
  ```json
  {
    "title": "Pelatihan Desain UI/UX 2026",
    "description": "Pelatihan dasar pengenalan Figma untuk antarmuka digital.",
    "date": "2026-11-20",
    "time": "09:00 - 12:00 WIB",
    "location": "Lab Komputer 3",
    "category": "Workshop",
    "image": "https://images.unsplash.com/photo-...",
    "price": 25000,
    "organizer": "Himpunan Mahasiswa",
    "quota": 50,
    "requirements": ["Membawa laptop", "Memiliki akun Figma"],
    "contactPic": "+62 811-2233-4455"
  }
  ```
* **Validasi Wajib:**
  * `title`: Wajib diisi, minimal 3 karakter.
  * `description`: Wajib diisi, minimal 10 karakter.
  * `date`, `location`, `category`, `organizer`: Wajib diisi.
  * `price`, `quota`: Tidak boleh bernilai negatif.
* **Respons Berhasil:** `HTTP 201 Created` (mengembalikan objek event lengkap beserta `id` yang di-generate).
* **Respons Error:** `HTTP 400 Bad Request` (jika ada data wajib yang belum lengkap atau format salah).

---

### 3. `GET /api/events/[id]`
* **Fungsi:** Mengambil data rincian satu event berdasarkan parameter ID.
* **Path Parameter:** `id` *(string)* — ID unik event (misal: `1`).
* **Respons Berhasil:** `HTTP 200 OK` (mengembalikan objek detail event tunggal).
* **Respons Error:** `HTTP 404 Not Found` (jika event dengan ID tersebut tidak ada di database).

---

### 4. `PATCH` / `PUT /api/events/[id]`
* **Fungsi:** Memperbarui data event yang ada di database.
* **Path Parameter:** `id` *(string)* — ID event yang akan diubah.
* **Request Body (JSON):** Objek JSON berisi atribut yang ingin diubah (misal: `{ "quota": 100, "status": "completed" }`).
* **Respons Berhasil:** `HTTP 200 OK` (mengembalikan objek event yang telah diperbarui).
* **Respons Error:** `HTTP 404 Not Found` (jika ID tidak ditemukan) atau `HTTP 400 Bad Request` (jika validasi gagal).

---

### 5. `DELETE /api/events/[id]`
* **Fungsi:** Menghapus event dari database server secara permanen.
* **Path Parameter:** `id` *(string)* — ID event yang akan dihapus.
* **Respons Berhasil:** `HTTP 200 OK`
  ```json
  {
    "success": true,
    "message": "Event dengan ID '1' berhasil dihapus.",
    "id": "1"
  }
  ```
* **Respons Error:** `HTTP 404 Not Found` (jika ID tidak ada di database).

---

## 7. Konfigurasi dan Manajemen Database

### Skema Tabel PostgreSQL (`events`)
```sql
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date VARCHAR(64) NOT NULL,
  time VARCHAR(64),
  location VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  image TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  organizer VARCHAR(255) NOT NULL,
  quota INTEGER NOT NULL DEFAULT 100 CHECK (quota >= 0),
  registered_count INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_pic VARCHAR(255),
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Performa
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_popular ON events(is_popular);
```

### Variabel Lingkungan Database (`.env.local`)
Format connection string PostgreSQL:
```env
# Koneksi Database Server
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# Konfigurasi Layanan Docker Lokal (Opsional jika pakai Docker)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgrespassword
POSTGRES_DB=eventhub
POSTGRES_PORT=5432

# Set true jika menghubungkan ke Cloud Database (Supabase / Neon / AWS RDS)
DB_SSL=false
```

### Mempertahankan Persistensi Data
* **Docker Compose:** Data database dipetakan ke Docker Named Volume `eventhub_pgdata`. Menjalankan `docker compose stop` atau `docker compose down` tidak akan menghapus data. Data hanya terhapus jika flag `-v` disertakan (`docker compose down -v`).
* **Cloud Database:** Data tersimpan pada storage persisten penyedia cloud dan tetap utuh saat aplikasi web direstart atau di-deploy ulang.

---

## 8. Status Pengembangan Fitur

### A. Fitur Selesai dan Terverifikasi
* [x] Migrasi penuh dari database embedded PGlite ke PostgreSQL Server eksternal.
* [x] Connection Pooling dengan driver resmi `pg` dan auto-SSL cloud detection.
* [x] Next.js 16 REST API Route Handlers (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`).
* [x] Halaman Beranda terintegrasi data database via REST API.
* [x] Halaman Eksplorasi Event terintegrasi filter dinamis (kategori, harga, lokasi, sort, search).
* [x] Halaman Detail Event dinamis terintegrasi ke database dengan handling 404 Not Found.
* [x] Halaman Kalender bulanan memetakan tanggal event dari database.
* [x] Dashboard Admin dengan operasi CRUD nyata (tambah, edit, hapus event) ke database server.
* [x] 26 skenario automated integration test (`npm run test:integration`) lolos 100%.

### B. Fitur Parsial / Menggunakan Simulasi Client
* [ ] **Pendaftaran Tiket Event:** Mahasiswa dapat membuka modal pendaftaran dan menghasilkan kode tiket di peramban, namun data registrasi belum disimpan ke tabel pendaftaran database.
* [ ] **Halaman Profil Mahasiswa:** Tab "Event Tersimpan" mengambil data dari API, namun profil diri dan tab "Tiket Terdaftar" masih menggunakan data mock statis.
* [ ] **Autentikasi Pengguna (Login & Register):** Antarmuka formulir tersedia dan memiliki validasi input di client, namun alur login menggunakan simulasi *mock context* (`AuthContext.tsx`) dan menyimpan status role di `localStorage`.

### C. Fitur Belum Diimplementasikan
* [ ] **Skema Database Pengguna (`users`):** Belum ada tabel akun user di PostgreSQL.
* [ ] **Backend Autentikasi Nyata:** Belum ada endpoint `/api/auth/login`, `/api/auth/register`, maupun `/api/auth/me`.
* [ ] **Enkripsi Kata Sandi:** Belum ada implementasi hashing password (`bcryptjs`/`argon2`).
* [ ] **Manajemen Sesi:** Belum ada JWT token atau session cookie.
* [ ] **Middleware Proteksi Rute (`middleware.ts`):** Rute `/dashboard` dan rute mutasi API belum diproteksi guard otorisasi admin.
* [ ] **Unggah Berkas Gambar Poster:** Masih menggunakan link URL teks, belum terintegrasi ke object storage (S3 / Supabase Storage).

---

## 9. Pengujian dan Troubleshooting

### Perintah Pengujian yang Tersedia
```bash
# 1. Menjalankan pengujian integrasi database & API (26 test cases)
npm run test:integration

# 2. Pengecekan aturan penulisan kode (ESLint)
npm run lint

# 3. Pengujian kompilasi produksi Next.js
npm run build
```

### Panduan Troubleshooting Masalah Umum

#### 1. Error: `[DATABASE_CONFIG_ERROR] Environment variable DATABASE_URL belum dikonfigurasi`
* **Penyebab:** File `.env.local` belum dibuat atau variabel `DATABASE_URL` bernilai kosong.
* **Solusi:** Buat file `.env.local` dari `.env.example` dan isi connection string PostgreSQL yang valid.

#### 2. Error: `Connection terminated due to connection timeout`
* **Penyebab:** Aplikasi tidak dapat menjangkau host database dalam batas waktu yang ditentukan.
* **Solusi:**
  * Jika menggunakan **Supabase Cloud**, pastikan jaringan internet Anda mendukung IPv6 (karena direct connection host `db.[ref].supabase.co` menggunakan IPv6).
  * Jika jaringan internet Anda hanya mendukung IPv4, gunakan **Supavisor Connection Pooler** dari Supabase (host: `aws-0-[region].pooler.supabase.com` port `6543` atau `5432`).
  * Pastikan nilai timeout pada `lib/db.ts` memadai untuk koneksi lintas negara (default saat ini: 15.000 ms).
  * Pastikan `DB_SSL=true` diatur di `.env.local`.

#### 3. Error: `getaddrinfo ENOTFOUND` atau `ECONNREFUSED 127.0.0.1:5432`
* **Penyebab:** Database server lokal atau kontainer Docker belum dinyalakan.
* **Solusi:** Jalankan `docker compose up -d` atau pastikan service PostgreSQL lokal Anda dalam keadaan *Running*.

#### 4. Port 5432 atau Port 3000 Sedang Digunakan (*Port Conflict*)
* **Solusi Port Database (5432):** Ubah pemetaan port host di file `.env.local` dan `docker-compose.yml` (misal: `POSTGRES_PORT=5433`).
* **Solusi Port Web (3000):** Jalankan Next.js pada port alternatif:
  ```bash
  npm run dev -- -p 3001
  ```

#### 5. Error Seeding: Duplikasi Data atau Primary Key Violation
* **Penyebab:** ID event sudah ada di database saat seeding dijalankan.
* **Solusi:** Skrip [`scripts/seed.ts`](file:///c:/NEK/KULIAH/SEMESTER%207/Technopreneurship/Projects/eventhub/scripts/seed.ts) menggunakan sintaks `ON CONFLICT (id) DO UPDATE ...`, sehingga aman dijalankan kembali. Jika Anda ingin mengatur ulang dari tabel kosong, jalankan kueri SQL `TRUNCATE TABLE events;` sebelum menjalankan `npm run db:seed`.

---

## 10. Lisensi dan Pengembang
Proyek ini dikembangkan untuk kebutuhan platform kegiatan kemahasiswaan Universitas Negeri Padang (UNP).
