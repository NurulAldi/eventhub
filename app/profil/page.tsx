"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { userProfile } from "@/lib/mock-data";
import { apiGetEvents } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { RegisteredEvent, Event } from "@/types";

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
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function loadSavedEvents() {
      try {
        const eventsData = await apiGetEvents();
        setSavedEvents(eventsData.slice(0, 3));
      } catch (err) {
        console.error("Gagal memuat event tersimpan:", err);
      }
    }
    loadSavedEvents();
  }, []);

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
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Mahasiswa Aktif
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {currentUser.email} &bull; NIM: {currentUser.nim}
            </p>
            <p className="text-xs text-gray-600 font-medium">
              {currentUser.major}, {currentUser.faculty}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-900 text-white font-semibold text-xs sm:text-sm rounded-md hover:bg-gray-800 transition cursor-pointer self-start sm:self-auto shadow-xs"
        >
          Masuk ke Dashboard Admin &rarr;
        </Link>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Column: Interactive Tabs Container */}
        <div className="flex-1 w-full bg-white border border-gray-300 rounded-xl shadow-xs overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200 text-xs sm:text-sm font-bold bg-gray-50/50">
            <button
              type="button"
              onClick={() => setActiveTab("registered")}
              className={`flex-1 py-3.5 px-4 text-center border-b-2 transition cursor-pointer ${
                activeTab === "registered"
                  ? "border-gray-900 text-gray-900 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Event Diikuti ({currentUser.registeredEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`flex-1 py-3.5 px-4 text-center border-b-2 transition cursor-pointer ${
                activeTab === "saved"
                  ? "border-gray-900 text-gray-900 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Disimpan ({savedEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reminders")}
              className={`flex-1 py-3.5 px-4 text-center border-b-2 transition cursor-pointer ${
                activeTab === "reminders"
                  ? "border-gray-900 text-gray-900 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Pengingat Jadwal ({reminders.filter((r) => r.enabled).length})
            </button>
          </div>

          {/* Tab 1: Event Diikuti (E-Tickets) */}
          {activeTab === "registered" && (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  TIKET PENDAFTARAN RESMI
                </span>
                <span className="text-xs text-gray-500">Klik &quot;Lihat E-Ticket&quot; untuk menampilkan barcode QR</span>
              </div>

              {currentUser.registeredEvents.map((ticket) => (
                <div
                  key={ticket.ticketId}
                  className="p-4 sm:p-5 border border-gray-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/40 hover:border-gray-400 transition"
                >
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-800">
                        {ticket.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Tiket Aktif #{ticket.ticketId}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 leading-snug">
                      {ticket.eventTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 mt-1">
                      <span>📅 {ticket.date}</span>
                      <span>⏰ {ticket.time}</span>
                      <span>📍 {ticket.location}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(ticket)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gray-900 text-white font-bold text-xs rounded-md hover:bg-gray-800 transition cursor-pointer text-center"
                    >
                      Lihat E-Ticket QR
                    </button>
                    <Link
                      href={`/event/${ticket.eventId}`}
                      className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 bg-white text-gray-700 font-semibold text-xs rounded-md hover:bg-gray-50 transition text-center"
                    >
                      Detail Event
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Event Disimpan (Wishlist) */}
          {activeTab === "saved" && (
            <div className="p-6 flex flex-col gap-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
                EVENT YANG DISIMPAN KE WISHLIST
              </span>

              {savedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 border border-gray-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white hover:border-gray-400 transition"
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {evt.category}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {evt.price === 0 ? "Gratis" : `Rp ${evt.price.toLocaleString("id-ID")}`}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      📅 {evt.date} &bull; 📍 {evt.location}
                    </p>
                  </div>

                  <Link
                    href={`/event/${evt.id}`}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white font-semibold text-xs rounded-md hover:bg-gray-800 transition text-center shrink-0"
                  >
                    Daftar Sekarang &rarr;
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Pengingat Jadwal (Reminders) */}
          {activeTab === "reminders" && (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  PENGINGAT DEADLINE & JADWAL KEGIATAN
                </span>
                <span className="text-xs text-gray-500">Aktifkan notifikasi pengingat via email/browser</span>
              </div>

              <div className="flex flex-col gap-3">
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-4 border border-gray-300 rounded-lg flex items-center justify-between gap-4 bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔔</span>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                          {rem.title}
                        </span>
                        <span className="text-xs text-gray-500">Waktu: {rem.time}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleReminder(rem.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                        rem.enabled
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-gray-200 text-gray-600 border border-gray-300"
                      }`}
                    >
                      {rem.enabled ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>
                ))}
              </div>
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
