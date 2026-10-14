import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profil Saya | EventHub Kampus",
  description: "Kelola profil mahasiswa, tiket event terdaftar, dan sertifikat kegiatan.",
};

export default function ProfilePage() {
  const tabs = ["Event Terdaftar (3)", "Riwayat Kegiatan", "Sertifikat Digital", "Pengaturan Akun"];

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
          <Link href="/event" className="text-gray-600 hover:text-gray-900">
            Daftar Event
          </Link>
          <Link href="/kalender" className="text-gray-600 hover:text-gray-900">
            Kalender
          </Link>
          <Link href="/profil" className="text-gray-900 font-bold">
            Profil
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
          >
            Admin Panel
          </Link>
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-gray-900 text-white font-bold text-xs flex items-center justify-center"
          >
            MF
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-10 flex flex-col gap-8">
        {/* Profile Card Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-gray-900 flex items-center justify-center text-xl font-extrabold text-gray-800">
              MF
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-extrabold text-gray-900">Muhammad Fauzan</h1>
              <p className="text-xs text-gray-500">NIM: 21081010001 &bull; Teknik Informatika</p>
              <p className="text-xs text-gray-400">fauzan@mahasiswa.ac.id</p>
            </div>
          </div>

          <button
            type="button"
            className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Edit Profil
          </button>
        </div>

        {/* Profile Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              type="button"
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                idx === 0
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Registered Events Section Shell */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-900">Event Yang Diikuti</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between gap-4 shadow-xs hover:border-gray-400 transition"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                      Tiket Terbit
                    </span>
                    <span className="text-xs text-gray-400">#EVT-{202600 + item}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 line-clamp-2">
                    National Tech Workshop & Career Talk 2026
                  </h3>
                  <p className="text-xs text-gray-500">📅 28 Okt 2026 &bull; 09:00 WIB</p>
                  <p className="text-xs text-gray-500">📍 Auditorium Utama Lt. 3</p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-xs font-semibold text-gray-900 border border-gray-300 rounded px-3 py-1 hover:bg-gray-50 transition"
                  >
                    Lihat E-Ticket QR
                  </button>
                  <Link
                    href={`/event/${item}`}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-900"
                  >
                    Detail &rarr;
                  </Link>
                </div>
              </div>
            ))}
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
