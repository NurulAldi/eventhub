# EventHub Kampus — Project Graph & File Map

Berikut adalah struktur proyek lengkap **EventHub Kampus** di mana setiap file disertai penjelasan ringkas mengenai fungsinya tepat di sebelah nama file tersebut.

```text
web-eventhub/
├── .env.example                               # Template variabel lingkungan (DATABASE_URL, AUTH_SECRET, storage)
├── .env.local                                 # Konfigurasi environment lokal aktif (koneksi PostgreSQL & secret key)
├── AGENTS.md                                  # Dokumentasi agent Next.js internal / instruksi tools
├── copilot_instructions.md                    # Standar arsitektur, SOLID, error handling, & panduan coding asisten
├── docker-compose.yml                         # Konfigurasi container Docker untuk menjalankan database PostgreSQL lokal
├── eslint.config.mjs                          # Konfigurasi linter ESLint untuk Next.js dan TypeScript
├── next-env.d.ts                              # Deklarasi tipe bawaan Next.js untuk TypeScript
├── next.config.ts                             # Konfigurasi runtime Next.js, compiler, & izin domain remote image
├── package.json                               # Definisi dependensi proyek (Next 16, React 19, pg) & script perintah
├── package-lock.json                          # Lockfile pohon dependensi npm yang terkunci
├── project-graph.md                           # Peta struktur direktori lengkap beserta deskripsi tiap file
├── proxy.ts                                   # Skrip proxy lokal development untuk perutean port
├── README.md                                  # Dokumentasi pengenalan proyek, fitur, & panduan instalasi
├── tsconfig.json                              # Konfigurasi kompilasi TypeScript dengan path alias @/*
├── tsconfig.tsbuildinfo                       # Cache file build inkremental TypeScript
├── weekly-software-developement.md            # Log pengerjaan mingguan, konversi Figma, & pelacakan milestone fitur
│
├── app/                                       # Direktori utama Next.js App Router (Layout, Halaman, & API)
│   ├── favicon.ico                            # Ikon tab browser aplikasi web
│   ├── globals.css                            # Styling global Tailwind CSS v4 & variabel palet warna sistem
│   ├── layout.tsx                             # Root layout aplikasi, font Geist, Navbar, Footer, & AuthProvider
│   ├── page.tsx                               # Halaman Beranda (Landing Page), banner, rekomendasi, & pencarian
│   │
│   ├── api/                                   # Lapisan Backend REST API Route Handlers
│   │   ├── admin/
│   │   │   ├── stats/route.ts                 # GET: Mengambil metrik total pengguna aktif untuk dashboard admin
│   │   │   ├── users/route.ts                 # GET: Mengambil daftar pengguna biasa (khusus role 'user')
│   │   │   └── users/[id]/route.ts            # PATCH (update/toggle status) & DELETE (hapus akun user non-admin)
│   │   │
│   │   ├── auth/
│   │   │   ├── login/route.ts                 # POST: Validasi kredensial email & password, menerbitkan cookie sesi
│   │   │   ├── logout/route.ts                # POST: Menghapus cookie sesi autentikasi dari browser
│   │   │   ├── me/route.ts                    # GET: Mengembalikan data profil pengguna aktif saat ini
│   │   │   └── register/route.ts              # POST: Mendaftarkan akun mahasiswa baru dengan enkripsi password
│   │   │
│   │   ├── events/
│   │   │   ├── route.ts                       # GET (filter & katalog event) dan POST (pengajuan event oleh user)
│   │   │   └── [id]/route.ts                  # GET (detail), PATCH (update), POST (daftar tiket), DELETE (hapus event)
│   │   │
│   │   └── uploads/route.ts                   # POST: Mengunggah file poster/gambar event ke cloud storage
│   │
│   ├── dashboard/                             # Portal Administrasi Khusus Role Admin
│   │   ├── layout.tsx                         # Proteksi rute admin server-side & pembungkus AdminSidebar
│   │   ├── page.tsx                           # Dashboard ringkasan admin: 4 metrik sistem & tabel kelola event
│   │   └── pengguna/page.tsx                  # Halaman monitoring & kelola akun user biasa (bukan admin)
│   │
│   ├── event/                                 # Modul Eksplorasi & Detail Event
│   │   ├── page.tsx                           # Katalog seluruh event dengan filter multi-kategori, harga, & lokasi
│   │   └── [id]/page.tsx                      # Detail event, blok konten, tiket QR, & tombol daftar (disabled jika pemilik)
│   │
│   ├── kalender/page.tsx                      # Halaman kalender interaktif untuk visualisasi jadwal event per tanggal
│   ├── login/page.tsx                         # Halaman formulir login untuk mahasiswa dan admin
│   ├── notifikasi/page.tsx                    # Pusat notifikasi pengguna & pengingat deadline event
│   ├── pengajuan-event/page.tsx               # Formulir pengajuan event baru dengan upload gambar & blok teks
│   ├── profil/page.tsx                        # Dashboard profil user: tiket diikuti, wishlist, & event yang diajukan
│   └── register/page.tsx                      # Halaman pendaftaran akun baru dengan input teks bebas universitas
│
├── components/                                # Komponen Antarmuka Reusable (UI)
│   ├── AdminSidebar.tsx                       # Sidebar navigasi panel admin (Dashboard & Manajemen Pengguna)
│   ├── EventCard.tsx                          # Kartu ringkasan event untuk beranda, katalog, dan rekomendasi
│   ├── Footer.tsx                             # Komponen footer informasi kampus dan navigasi bawah
│   ├── Navbar.tsx                             # Navigasi utama dengan deteksi status login, menu, & tombol CTA
│   └── NotificationBootstrap.tsx              # Listener sisi klien untuk inisialisasi reminder notifikasi
│
├── context/                                   # Manajemen State Global Aplikasi
│   └── AuthContext.tsx                        # React Context penyedia session user, login, register, & logout
│
├── lib/                                       # Modul Helper, Logika Bisnis, & Koneksi Database
│   ├── api.ts                                 # Client API fetcher wrapper untuk memanggil endpoint REST backend
│   ├── auth.ts                                # Keamanan: hashing password scrypt, cookie sesi HMAC, & guard role
│   ├── db.ts                                  # Database pool PostgreSQL, query wrapper, & inisialisasi skema tabel
│   ├── event-popularity.ts                    # Logika perhitungan badge popularitas event berdasarkan pendaftar
│   ├── mock-data.ts                           # Data fixture awal untuk pengujian dan seeding database
│   ├── notifications.ts                       # Helper penyimpanan preferensi alarm/reminder notifikasi event
│   ├── submissions.ts                         # Helper penyimpanan lokal riwayat pengajuan event user
│   ├── tickets.ts                             # Helper penyimpanan e-ticket lokal, pembersihan tiket, & barcode QR
│   ├── wishlist.ts                            # Helper penyimpanan daftar simpanan/wishlist event per user
│   └── services/
│       └── event-service.ts                   # Service layer operasi CRUD event & query SQL dinamis PostgreSQL
│
├── types/                                     # Definisi Tipe Data TypeScript
│   └── index.ts                               # Type definitions (Event, AdminUser, RegisteredEvent, Category, dll)
│
├── scripts/                                   # Skrip CLI Pemeliharaan & Pengujian Database
│   ├── clear-events.ts                        # Skrip CLI untuk mengosongkan seluruh isi tabel events
│   ├── hash-password.ts                       # Skrip CLI untuk menghasilkan hash password scrypt mandiri
│   ├── init-db.ts                             # Skrip CLI inisialisasi tabel users & events serta indeks PostgreSQL
│   └── test-integration.ts                    # Test suite verifikasi query database PostgreSQL & REST API
│
├── figma-html/                                # Aset Referensi Mockup Desain Asli dari Figma
│   ├── beranda.html                           # Mockup mentah tampilan beranda/landing page
│   ├── daftar-event.html                      # Mockup mentah tampilan eksplorasi daftar event
│   ├── dashboard-admin.html                   # Mockup mentah tampilan dashboard administrator
│   ├── detail-event.html                      # Mockup mentah tampilan detail event
│   ├── kalender-event.html                    # Mockup mentah tampilan kalender event
│   ├── login.html                             # Mockup mentah tampilan formulir login
│   ├── profil.html                            # Mockup mentah tampilan profil pengguna & tiket
│   └── register.html                          # Mockup mentah tampilan formulir registrasi
│
└── public/                                    # Aset Statis Publik (Gambar & Ikon Vektor)
    ├── file.svg                               # Ikon berkas dokumen SVG
    ├── globe.svg                              # Ikon bola dunia/web SVG
    ├── next.svg                               # Logo Next.js SVG
    ├── vercel.svg                             # Logo Vercel SVG
    └── window.svg                             # Ikon jendela aplikasi SVG
```
