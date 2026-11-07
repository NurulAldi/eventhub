"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { loginAsUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("Universitas Indonesia");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const universities = [
    "Universitas Indonesia",
    "Institut Teknologi Bandung",
    "Universitas Gadjah Mada",
    "Universitas Airlangga",
    "Institut Teknologi Sepuluh Nopember",
    "Universitas Diponegoro",
    "Universitas Brawijaya",
    "Binus University",
    "Lainnya",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name || !email || !password) {
      setErrorMsg("Mohon lengkapi seluruh formulir registrasi.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      loginAsUser();
      alert(`Pendaftaran akun atas nama ${name} berhasil!`);
      router.push("/profil");
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 bg-[#F7F4EE]">
      <div className="w-full max-w-[480px] p-8 sm:p-10 bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl shadow-xs flex flex-col gap-6">
        {/* Header - Matching register.html */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold text-[#29374A] tracking-tight">
            Buat Akun Baru
          </h1>
          <p className="text-xs sm:text-sm text-[#6F7580]">
            Daftar untuk mulai menemukan event kampus terbaik.
          </p>
        </div>

        <div className="h-px bg-[#E4DCCF]" />

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
            {errorMsg}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nama Lengkap */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-xs font-bold text-[#29374A] uppercase tracking-wide"
            >
              Nama Lengkap
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              required
              className="w-full px-3.5 py-3 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E4DCCF] rounded-md focus:bg-[#FFFCF6] focus:outline-none focus:border-[#315E9E] transition"
            />
          </div>

          {/* Email Mahasiswa */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-bold text-[#29374A] uppercase tracking-wide"
            >
              Email Mahasiswa
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@mahasiswa.ui.ac.id"
              required
              className="w-full px-3.5 py-3 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E4DCCF] rounded-md focus:bg-[#FFFCF6] focus:outline-none focus:border-[#315E9E] transition"
            />
          </div>

          {/* Universitas */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="university"
              className="text-xs font-bold text-[#29374A] uppercase tracking-wide"
            >
              Universitas / Perguruan Tinggi
            </label>
            <select
              id="university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-3.5 py-3 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E4DCCF] rounded-md focus:bg-[#FFFCF6] focus:outline-none focus:border-[#315E9E] transition cursor-pointer text-[#29374A]"
            >
              {universities.map((univ) => (
                <option key={univ} value={univ}>
                  {univ}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-bold text-[#29374A] uppercase tracking-wide"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              className="w-full px-3.5 py-3 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E4DCCF] rounded-md focus:bg-[#FFFCF6] focus:outline-none focus:border-[#315E9E] transition"
            />
          </div>

          {/* Konfirmasi Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-bold text-[#29374A] uppercase tracking-wide"
            >
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi"
              required
              className="w-full px-3.5 py-3 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E4DCCF] rounded-md focus:bg-[#FFFCF6] focus:outline-none focus:border-[#315E9E] transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-3 bg-[#315E9E] text-white font-bold text-sm rounded-md hover:bg-[#244777] transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isLoading ? "Mendaftarkan Akun..." : "Daftar Sekarang"}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs sm:text-sm text-[#6F7580] flex items-center justify-center gap-1.5 pt-2 border-t border-[#ECE5DA]">
          <span>Sudah memiliki akun?</span>
          <Link href="/login" className="font-bold text-[#29374A] hover:underline">
            Masuk Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
