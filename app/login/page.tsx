"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginAsUser, loginAsAdmin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Mohon isi email kampus dan kata sandi Anda.");
      return;
    }

    setIsLoading(true);

    // Simulated network authentication delay
    setTimeout(() => {
      setIsLoading(false);
      if (email.toLowerCase().includes("admin")) {
        loginAsAdmin();
        router.push("/dashboard");
      } else {
        loginAsUser();
        router.push("/profil");
      }
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 bg-[#F7F4EE]">
      <div className="w-full max-w-[480px] p-8 sm:p-10 card-sand border rounded-xl shadow-sm flex flex-col gap-6">
        {/* Header - Matching login.html */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold text-[#29374A] tracking-tight">
            Masuk Akun
          </h1>
          <p className="text-xs sm:text-sm text-[#6F7580]">
            Silakan masuk menggunakan email kampus terdaftarmu.
          </p>
        </div>

        <div className="h-px bg-[#E4DCCF]" />

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-bold text-[#29374A] uppercase tracking-wide"
            >
              Email Mahasiswa
            </label>
            <div className="relative">
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
            <span className="text-[11px] text-[#92959C]">
              Tips: Gunakan email dengan kata <code>admin</code> untuk simulasi akun Admin.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-bold text-[#29374A] uppercase tracking-wide"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => alert("Simulasi: Link reset password telah dikirim ke email kampus Anda.")}
                className="text-xs text-[#6F7580] hover:text-[#29374A] cursor-pointer"
              >
                Lupa Password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3.5 py-3 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E4DCCF] rounded-md focus:bg-[#FFFCF6] focus:outline-none focus:border-[#315E9E] transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-3 bg-[#315E9E] text-white font-bold text-sm rounded-md hover:bg-[#244777] transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isLoading ? "Memverifikasi..." : "Masuk Sekarang"}
          </button>
        </form>

        {/* Quick Demo Shortcuts */}
        <div className="p-3 bg-[#F7F4EE] border border-[#E4DCCF] rounded-lg flex flex-col gap-2 text-xs">
          <span className="font-semibold text-[#6F7580]">Pilihan Cepat Masuk (Simulasi):</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                loginAsUser();
                router.push("/profil");
              }}
              className="flex-1 py-1.5 bg-[#FFFCF6] border border-[#E4DCCF] text-[#29374A] font-medium rounded hover:bg-[#F0E9DC] transition cursor-pointer text-center"
            >
              Mahasiswa &rarr;
            </button>
            <button
              type="button"
              onClick={() => {
                loginAsAdmin();
                router.push("/dashboard");
              }}
              className="flex-1 py-1.5 bg-[#FFFCF6] border border-[#E4DCCF] text-[#29374A] font-bold rounded hover:bg-[#F0E9DC] transition cursor-pointer text-center"
            >
              Admin &rarr;
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs sm:text-sm text-[#6F7580] flex items-center justify-center gap-1.5 pt-2 border-t border-[#ECE5DA]">
          <span>Belum punya akun?</span>
          <Link href="/register" className="font-bold text-[#29374A] hover:underline">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
