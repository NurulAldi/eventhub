"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { loginAsUser } = useAuth();
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsUser();
    router.push("/profil");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8 sm:p-10 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-gray-900">Daftar Akun Baru</h1>
          <p className="text-sm text-gray-500">
            Lengkapi data berikut untuk bergabung dengan EventHub Kampus.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Nama Lengkap
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Muhammad Fauzan"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nim" className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              NIM / Nomor Induk Mahasiswa
            </label>
            <input
              id="nim"
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Contoh: 21081010001"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Email Mahasiswa
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@mahasiswa.ac.id"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full py-2.5 bg-gray-900 text-white font-semibold text-sm rounded-md hover:bg-gray-800 transition cursor-pointer"
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
    </div>
  );
}
