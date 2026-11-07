"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide the public footer when viewing the Admin Dashboard
  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-slate-100 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-12 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          {/* Brand Info */}
          <div className="max-w-sm flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm">
                E
              </span>
              <span className="font-bold text-lg text-slate-900">EventHub Kampus</span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Platform agregasi event kampus terlengkap untuk mempermudah mahasiswa Indonesia mencari info lomba, beasiswa, seminar, dan workshop.
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="flex flex-wrap gap-12 sm:gap-16">
            {/* Tautan Utama */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tautan Utama
              </span>
              <nav className="flex flex-col gap-2 text-xs sm:text-sm text-slate-500">
                <Link href="/" className="hover:text-indigo-600 transition">
                  Beranda
                </Link>
                <Link href="/event" className="hover:text-indigo-600 transition">
                  Daftar Event
                </Link>
                <Link href="/kalender" className="hover:text-indigo-600 transition">
                  Kalender Event
                </Link>
                <Link href="/profil" className="hover:text-indigo-600 transition">
                  Profil Saya
                </Link>
                <Link href="/dashboard" className="hover:text-indigo-600 transition">
                  Dashboard Admin
                </Link>
              </nav>
            </div>

            {/* Kategori Event */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Kategori Event
              </span>
              <div className="flex flex-col gap-2 text-xs sm:text-sm text-slate-500">
                <Link href="/event?category=lomba" className="hover:text-indigo-600 transition">
                  Lomba Akademik
                </Link>
                <Link href="/event?category=seminar" className="hover:text-indigo-600 transition">
                  Seminar & Webinar
                </Link>
                <Link href="/event?category=workshop" className="hover:text-indigo-600 transition">
                  Workshop & Bootcamp
                </Link>
                <Link href="/event?category=beasiswa" className="hover:text-indigo-600 transition">
                  Beasiswa Mahasiswa
                </Link>
              </div>
            </div>

            {/* Akun & Bantuan */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Akun & Bantuan
              </span>
              <div className="flex flex-col gap-2 text-xs sm:text-sm text-slate-500">
                <Link href="/login" className="hover:text-indigo-600 transition">
                  Masuk Akun
                </Link>
                <Link href="/register" className="hover:text-indigo-600 transition">
                  Pendaftaran Baru
                </Link>
                <a href="mailto:support@eventhub.ac.id" className="hover:text-indigo-600 transition">
                  Hubungi Bantuan
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <span>&copy; 2026 EventHub Kampus. Semua Hak Dilindungi.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">Ketentuan Layanan</a>
            <span>&bull;</span>
            <a href="#" className="hover:underline">Kebijakan Privasi</a>
            <span>&bull;</span>
            <a href="#" className="hover:underline">Pusat Bantuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
