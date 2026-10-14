import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Daftar Akun | EventHub Kampus",
  description: "Registrasi akun mahasiswa untuk mengikuti berbagai kegiatan dan event kampus.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Shell Header */}
      <header className="h-20 bg-white border-b border-gray-200 px-6 lg:px-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded border-2 border-gray-900 flex items-center justify-center font-bold text-gray-900 text-sm">
            E
          </span>
          <span className="font-bold text-lg text-gray-900">EventHub Kampus</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          &larr; Kembali ke Beranda
        </Link>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8 sm:p-10 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-gray-900">Daftar Akun Baru</h1>
            <p className="text-sm text-gray-500">
              Lengkapi data berikut untuk bergabung dengan EventHub Kampus.
            </p>
          </div>

          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                placeholder="Contoh: Muhammad Fauzan"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="nim" className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                NIM / Nomor Induk Mahasiswa
              </label>
              <input
                id="nim"
                type="text"
                placeholder="Contoh: 21081010001"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Email Mahasiswa
              </label>
              <input
                id="email"
                type="email"
                placeholder="nama@mahasiswa.ac.id"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-2.5 bg-gray-900 text-white font-semibold text-sm rounded-md hover:bg-gray-800 transition"
            >
              Daftar Sekarang
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="font-bold text-gray-900 hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Shell */}
      <footer className="py-6 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} EventHub Kampus. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
}
