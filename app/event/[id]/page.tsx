import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Detail Event #${id} | EventHub Kampus`,
    description: `Informasi lengkap mengenai jadwal, pembicara, dan pendaftaran event #${id}`,
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Shell Header / Navbar */}
      <header className="h-20 bg-white border-b border-gray-200 px-6 lg:px-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded border-2 border-gray-900 flex items-center justify-center font-bold text-gray-900 text-sm">
              E
            </span>
            <span className="font-bold text-lg text-gray-900">EventHub Kampus</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-md px-4 py-2 w-64 text-sm text-gray-400">
            <span>🔍</span>
            <span>Cari event...</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Beranda
          </Link>
          <Link href="/event" className="text-gray-900 font-bold">
            Daftar Event
          </Link>
          <Link href="/kalender" className="text-gray-600 hover:text-gray-900">
            Kalender
          </Link>
          <Link href="/profil" className="text-gray-600 hover:text-gray-900">
            Profil
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 border border-gray-900 rounded-md hover:bg-gray-800 transition"
          >
            Daftar
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-8 flex flex-col gap-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:underline">Beranda</Link>
          <span>/</span>
          <Link href="/event" className="hover:underline">Daftar Event</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Detail Event #{id}</span>
        </nav>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Event Poster Shell */}
            <div className="w-full h-80 sm:h-96 bg-gray-200 border border-gray-300 rounded-xl flex items-center justify-center text-gray-400 font-medium">
              Poster Utama Event #{id}
            </div>

            {/* Event Details Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 text-gray-800">
                  Seminar Nasional
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Pendaftaran Dibuka
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                AI Revolution: Transformasi Digital Kampus Masa Depan
              </h1>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-sm">
                <div>
                  <span className="block text-xs text-gray-400">Tanggal</span>
                  <span className="font-semibold text-gray-800">28 Oktober 2026</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400">Waktu</span>
                  <span className="font-semibold text-gray-800">09:00 - 13:00 WIB</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400">Lokasi</span>
                  <span className="font-semibold text-gray-800">Auditorium Utama</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
                <h2 className="text-lg font-bold text-gray-900">Deskripsi Event</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Seminar ini menghadirkan para pakar terkemuka di bidang artificial intelligence dan teknologi terapan untuk membahas bagaimana inovasi terbaru dapat diterapkan dalam lingkungan akademik dan karier profesional.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Peserta akan mendapatkan sertifikat resmi (e-certificate), modul materi, dan kesempatan networking bersama pembicara serta komunitas teknologi kampus.
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
                <h2 className="text-lg font-bold text-gray-900">Syarat & Ketentuan</h2>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Mahasiswa aktif (menunjukkan KTM atau NIM saat pendaftaran)</li>
                  <li>Membawa laptop atau perangkat pendukung jika diperlukan</li>
                  <li>Hadir 15 menit sebelum acara dimulai</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar CTA Box */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-5 sticky top-8">
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Biaya Pendaftaran</span>
                <div className="text-2xl font-black text-gray-900 mt-1">Gratis</div>
                <p className="text-xs text-gray-500 mt-1">Kuota tersisa 45 dari 200 kursi</p>
              </div>

              <button
                type="button"
                className="w-full py-3 bg-gray-900 text-white font-semibold text-sm rounded-md hover:bg-gray-800 transition"
              >
                Daftar Sekarang
              </button>

              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Penyelenggara:</span>
                  <span className="font-semibold text-gray-900">BEM Fakultas Teknik</span>
                </div>
                <div className="flex justify-between">
                  <span>Batas Pendaftaran:</span>
                  <span className="font-semibold text-gray-900">26 Okt 2026</span>
                </div>
                <div className="flex justify-between">
                  <span>Kontak PIC:</span>
                  <span className="font-semibold text-gray-900">+62 812-3456-7890</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Shell */}
      <footer className="bg-white border-t border-gray-200 py-8 px-6 lg:px-16 text-center text-xs text-gray-500 mt-12">
        &copy; {new Date().getFullYear()} EventHub Kampus. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
}
