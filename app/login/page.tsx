import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Masuk | EventHub Kampus",
  description: "Masuk ke akun EventHub Kampus untuk mendaftar dan memantau kegiatan event.",
};

export default function LoginPage() {
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
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8 sm:p-10 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-gray-900">Masuk Akun</h1>
            <p className="text-sm text-gray-500">
              Silakan masuk menggunakan email kampus terdaftarmu.
            </p>
          </div>

          <form className="flex flex-col gap-4">
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Kata Sandi
                </label>
                <a href="#" className="text-xs text-gray-500 hover:text-gray-900">
                  Lupa Password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-2.5 bg-gray-900 text-white font-semibold text-sm rounded-md hover:bg-gray-800 transition"
            >
              Masuk Sekarang
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
            Belum punya akun?{" "}
            <Link href="/register" className="font-bold text-gray-900 hover:underline">
              Daftar di sini
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
