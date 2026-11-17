"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-bold text-lg text-white">EventHub Kampus</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Platform informasi event kampus terlengkap untuk mahasiswa Indonesia. Lomba, seminar, beasiswa, dan workshop dalam satu platform.
            </p>
            <p className="text-xs text-gray-500">Dari Mahasiswa, Untuk Mahasiswa.</p>
          </div>

          {/* Navigasi */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Navigasi</span>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/" className="hover:text-white transition">Beranda</Link>
              <Link href="/event" className="hover:text-white transition">Jelajahi Event</Link>
              <Link href="/kalender" className="hover:text-white transition">Kalender Event</Link>
              <Link href="/pengajuan-event" className="hover:text-white transition">Ajukan Event</Link>
            </nav>
          </div>

          {/* Kategori */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Kategori Event</span>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/event?category=Lomba" className="hover:text-white transition">Lomba &amp; Kompetisi</Link>
              <Link href="/event?category=Seminar" className="hover:text-white transition">Seminar &amp; Webinar</Link>
              <Link href="/event?category=Beasiswa" className="hover:text-white transition">Beasiswa</Link>
              <Link href="/event?category=Workshop" className="hover:text-white transition">Workshop</Link>
              <Link href="/event?category=Organisasi" className="hover:text-white transition">Organisasi</Link>
              <Link href="/event?category=Technopreneurship" className="hover:text-white transition">Technopreneurship</Link>
            </div>
          </div>

          {/* Akun */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Akun &amp; Bantuan</span>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/login" className="hover:text-white transition">Masuk</Link>
              <Link href="/register" className="hover:text-white transition">Daftar Akun</Link>
              <Link href="/profil" className="hover:text-white transition">Profil Saya</Link>
              <a href="mailto:support@eventhubkampus.id" className="hover:text-white transition">Hubungi Kami</a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <span>© 2026 EventHub Kampus. Semua Hak Dilindungi.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-gray-300 transition">Ketentuan Layanan</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-300 transition">Kebijakan Privasi</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
