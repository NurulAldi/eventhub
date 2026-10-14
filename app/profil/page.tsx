"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, isLoggedIn, loginAsUser } = useAuth();
  const tabs = ["Event Terdaftar (3)", "Riwayat Kegiatan", "Sertifikat Digital", "Pengaturan Akun"];
  const [activeTab, setActiveTab] = useState(0);

  if (!isLoggedIn || !user) {
    return (
      <div className="flex-1 max-w-md mx-auto my-20 p-8 bg-white border border-gray-200 rounded-xl text-center shadow-xs flex flex-col gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-xl">
          🔒
        </div>
        <h1 className="text-xl font-bold text-gray-900">Perlu Masuk Akun</h1>
        <p className="text-xs text-gray-500">
          Halaman profil hanya dapat diakses setelah masuk. Anda sedang dalam mode Tamu (Guest).
        </p>
        <div className="flex gap-2 justify-center mt-2">
          <Link
            href="/login"
            className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-md hover:bg-gray-800 transition"
          >
            Menuju Login
          </Link>
          <button
            type="button"
            onClick={loginAsUser}
            className="px-4 py-2 bg-gray-100 text-gray-800 text-xs font-semibold rounded-md hover:bg-gray-200 transition cursor-pointer"
          >
            Simulasikan Login Mahasiswa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-10 flex flex-col gap-8">
      {/* Profile Card Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gray-900 text-white border-2 border-gray-900 flex items-center justify-center text-xl font-extrabold">
            {user.avatarText}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900">{user.name}</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              NIM: {user.nim || "21081010001"} &bull; Teknik Informatika
            </p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-md hover:bg-gray-800 transition"
            >
              Buka Admin Panel
            </Link>
          )}
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded-md text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            Edit Profil
          </button>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === idx
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
                  className="text-xs font-semibold text-gray-900 border border-gray-300 rounded px-3 py-1 hover:bg-gray-50 transition cursor-pointer"
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
    </div>
  );
}
