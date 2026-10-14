"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { userProfile, events } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { RegisteredEvent } from "@/types";

export default function ProfilePage() {
  const { user: authUser } = useAuth();

  // Active user data merged with mock-data
  const currentUser = {
    name: authUser?.name || userProfile.name,
    email: authUser?.email || userProfile.email,
    nim: authUser?.nim || userProfile.nim,
    avatar: userProfile.avatar,
    faculty: userProfile.faculty,
    major: userProfile.major,
    phone: userProfile.phone,
    registeredEvents: userProfile.registeredEvents,
  };

  // State Tabs
  const [activeTab, setActiveTab] = useState<"registered" | "saved" | "reminders">("registered");
  const [selectedTicket, setSelectedTicket] = useState<RegisteredEvent | null>(null);

  // Reminder toggles state
  const [reminders, setReminders] = useState([
    {
      id: 1,
      title: "AI Revolution 2026 (Submit Form)",
      time: "27 Okt 2026, 09:00 WIB",
      enabled: true,
    },
    {
      id: 2,
      title: "National Tech Workshop (Registrasi Ulang)",
      time: "04 Nov 2026, 08:30 WIB",
      enabled: true,
    },
    {
      id: 3,
      title: "Campus Music Fest (Open Gate)",
      time: "20 Nov 2026, 17:00 WIB",
      enabled: false,
    },
  ]);

  const toggleReminder = (id: number) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const savedEvents = events.slice(0, 3);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-10 flex flex-col gap-8 bg-gray-50">
      {/* Profile Header Card - Matching profil.html */}
      <div className="bg-white border border-gray-300 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-gray-900 bg-gray-100 shrink-0">
            <Image
              src={currentUser.avatar}
              alt={currentUser.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {currentUser.name}
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                Mahasiswa Aktif
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              {currentUser.email}
            </p>
            <p className="text-xs text-gray-500">
              {currentUser.faculty} &bull; {currentUser.major} &bull; NIM: {currentUser.nim}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => alert(`Informasi Mahasiswa:\nNama: ${currentUser.name}\nNIM: ${currentUser.nim}\nJurusan: ${currentUser.major}`)}
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold rounded-md text-gray-700 transition cursor-pointer"
          >
            Edit Profil
          </button>
        </div>
      </div>

      {/* Tabs Navigation - Matching profil.html */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("registered")}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "registered"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>Event Terdaftar</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
            {currentUser.registeredEvents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "saved"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>Event Tersimpan</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
            {savedEvents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reminders")}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "reminders"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>Reminder Saya</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
            {reminders.filter((r) => r.enabled).length}
          </span>
        </button>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Column: Tab Contents */}
        <div className="flex-1 w-full flex flex-col gap-5">
          {activeTab === "registered" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Tiket Event yang Anda Ikuti
                </h2>
                <span className="text-xs text-gray-500">
                  {currentUser.registeredEvents.length} Event Aktif
                </span>
              </div>

              {currentUser.registeredEvents.map((evt) => (
                <div
                  key={evt.ticketId}
                  className="bg-white border border-gray-300 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-gray-400 transition"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 uppercase">
                        {evt.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                        #{evt.ticketId}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Tiket Terkonfirmasi
                      </span>
                    </div>

                    <Link
                      href={`/event/${evt.eventId}`}
                      className="text-base font-bold text-gray-900 hover:text-blue-600 transition"
                    >
                      {evt.eventTitle}
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>📅 {evt.date} &bull; {evt.time}</span>
                      <span>📍 {evt.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(evt)}
                      className="px-3.5 py-2 bg-gray-900 text-white text-xs font-bold rounded-md hover:bg-gray-800 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Lihat QR Tiket</span>
                      <span>&rarr;</span>
                    </button>
                    <Link
                      href={`/event/${evt.eventId}`}
                      className="px-3 py-2 border border-gray-300 text-xs font-semibold text-gray-700 rounded-md hover:bg-gray-50 transition"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "saved" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Event yang Anda Simpan
                </h2>
                <span className="text-xs text-gray-500">{savedEvents.length} Event Disimpan</span>
              </div>

              {savedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white border border-gray-300 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                      <Image
                        src={evt.image}
                        alt={evt.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        {evt.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1">
                        {evt.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        📅 {evt.date} &bull; {evt.organizer}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/event/${evt.id}`}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-md hover:bg-gray-800 text-center transition shrink-0"
                  >
                    Daftar Sekarang &rarr;
                  </Link>
                </div>
              ))}
            </div>
          )}

          {activeTab === "reminders" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Pengingat Jadwal Kegiatan
                </h2>
                <span className="text-xs text-gray-500">Notifikasi Kalender & Email</span>
              </div>

              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-gray-300 rounded-lg p-4 flex items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔔</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{r.title}</span>
                      <span className="text-xs text-gray-500">{r.time}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleReminder(r.id)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                      r.enabled ? "bg-gray-900 justify-end" : "bg-gray-300 justify-start"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Status & Informasi Mahasiswa */}
        <aside className="w-full lg:w-80 bg-white border border-gray-300 rounded-xl p-6 shadow-xs flex flex-col gap-5 shrink-0">
          <div className="border-b border-gray-200 pb-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Status Akademik Mahasiswa
            </h3>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Status Kuliah:</span>
              <span className="font-bold text-emerald-600">Aktif Normal</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Semester:</span>
              <span className="font-semibold text-gray-800">Semester 7 (Ganjil)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Tahun Akademik:</span>
              <span className="font-semibold text-gray-800">2026 / 2027</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Total Event Diikuti:</span>
              <span className="font-bold text-gray-900">3 Kegiatan</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/event"
              className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-md hover:bg-gray-800 transition block text-center"
            >
              Cari Event Lainnya &rarr;
            </Link>
          </div>
        </aside>
      </div>

      {/* Modal E-Ticket QR Code */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-gray-300 rounded-xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center gap-5 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between w-full border-b border-gray-200 pb-3">
              <span className="text-xs font-bold text-gray-400 uppercase">E-TICKET RESMI</span>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-gray-900">
                {selectedTicket.eventTitle}
              </h3>
              <span className="text-xs text-gray-500">
                {selectedTicket.date} &bull; {selectedTicket.time}
              </span>
            </div>

            {/* Mock QR Image */}
            <div className="p-3 bg-white border border-gray-300 rounded-xl shadow-xs">
              <div className="relative w-44 h-44">
                <Image
                  src={selectedTicket.qrCodeMock || "https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=EVENTHUB-TIKET"}
                  alt={`QR Code ${selectedTicket.ticketId}`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Nomor Tiket:</span>
                <span className="font-mono font-bold text-gray-900">#{selectedTicket.ticketId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Peserta:</span>
                <span className="font-semibold text-gray-800">{currentUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lokasi:</span>
                <span className="text-gray-700 truncate max-w-[170px]">{selectedTicket.location}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                alert(`Mengunduh E-Ticket #${selectedTicket.ticketId}... Tiket siap dicetak atau ditunjukkan di HP.`);
                setSelectedTicket(null);
              }}
              className="w-full py-2.5 bg-gray-900 text-white font-bold text-xs rounded-md hover:bg-gray-800 transition cursor-pointer"
            >
              Unduh / Cetak Tiket (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
