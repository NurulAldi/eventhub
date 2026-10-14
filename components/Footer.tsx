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
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-12 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          {/* Brand Info */}
          <div className="max-w-sm flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded border-2 border-gray-900 flex items-center justify-center font-bold text-gray-900 text-sm">
                E
              </span>
              <span className="font-bold text-lg text-gray-900">EventHub Kampus</span>
            </Link>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Platform agregasi event kampus terlengkap untuk mempermudah mahasiswa Indonesia mencari info lomba, beasiswa, seminar, dan workshop.
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="flex flex-wrap gap-12 sm:gap-16">
            {/* Tautan Utama */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Tautan Utama
              </span>
              <nav className="flex flex-col gap-2 text-xs sm:text-sm text-gray-600">
                <Link href="/" className="hover:text-gray-900 transition">
                  Beranda
                </Link>
                <Link href="/event" className="hover:text-gray-900 transition">
                  Daftar Event
                </Link>
                <Link href="/kalender" className="hover:text-gray-900 transition">
                  Kalender Event
                </Link>
                <Link href="/profil" className="hover:text-gray-900 transition">
                  Profil Saya
                </Link>
                <Link href="/dashboard" className="hover:text-gray-900 transition">
                  Dashboard Admin
                </Link>
              </nav>
            </div>

            {/* Kategori Event */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Kategori Event
              </span>
              <div className="flex flex-col gap-2 text-xs sm:text-sm text-gray-600">
                <Link href="/event?category=lomba" className="hover:text-gray-900 transition">
                  Lomba Akademik
                </Link>
                <Link href="/event?category=seminar" className="hover:text-gray-900 transition">
                  Seminar & Webinar
                </Link>
                <Link href="/event?category=workshop" className="hover:text-gray-900 transition">
                  Workshop & Bootcamp
                </Link>
                <Link href="/event?category=beasiswa" className="hover:text-gray-900 transition">
                  Beasiswa Mahasiswa
                </Link>
              </div>
            </div>

            {/* Akun & Bantuan */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Akun & Bantuan
              </span>
              <div className="flex flex-col gap-2 text-xs sm:text-sm text-gray-600">
                <Link href="/login" className="hover:text-gray-900 transition">
                  Masuk Akun
                </Link>
                <Link href="/register" className="hover:text-gray-900 transition">
                  Pendaftaran Baru
                </Link>
                <a href="mailto:support@eventhub.ac.id" className="hover:text-gray-900 transition">
                  Hubungi Bantuan
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} EventHub Kampus. Semua Hak Dilindungi.</span>
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
