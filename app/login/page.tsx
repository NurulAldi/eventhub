"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginAsUser, loginAsAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase().includes("admin")) {
      loginAsAdmin();
      router.push("/dashboard");
    } else {
      loginAsUser();
      router.push("/profil");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8 sm:p-10 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-gray-900">Masuk Akun</h1>
          <p className="text-sm text-gray-500">
            Silakan masuk menggunakan email kampus terdaftarmu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Email Mahasiswa / Admin
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="fauzan@mahasiswa.ac.id"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              required
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full py-2.5 bg-gray-900 text-white font-semibold text-sm rounded-md hover:bg-gray-800 transition cursor-pointer"
          >
            Masuk Sekarang
          </button>
        </form>

        {/* Quick Testing Shortcuts */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-gray-500">Tombol Cepat Pengujian:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                loginAsUser();
                router.push("/profil");
              }}
              className="flex-1 py-1.5 bg-white border border-gray-300 text-gray-800 text-xs font-medium rounded hover:bg-gray-100 transition cursor-pointer"
            >
              Masuk User Biasa
            </button>
            <button
              type="button"
              onClick={() => {
                loginAsAdmin();
                router.push("/dashboard");
              }}
              className="flex-1 py-1.5 bg-white border border-gray-300 text-gray-900 text-xs font-bold rounded hover:bg-gray-100 transition cursor-pointer"
            >
              Masuk Admin
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
          Belum punya akun?{" "}
          <Link href="/register" className="font-bold text-gray-900 hover:underline">
            Daftar di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
