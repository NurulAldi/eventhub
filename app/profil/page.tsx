"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { userProfile } from "@/lib/mock-data";
import { apiGetEventById, apiGetEvents } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { RegisteredEvent, Event } from "@/types";
import { getWishlistIds, subscribeToWishlist, toggleWishlist } from "@/lib/wishlist";
import {
  addNotification,
  getReminderPreferences,
  ReminderTrigger,
  setReminderPreference,
} from "@/lib/notifications";
import { getRegisteredTickets, removeRegisteredTickets, subscribeToTickets } from "@/lib/tickets";
import { getSubmittedEvents } from "@/lib/submissions";

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
  const submissionOrganizer = currentUser.name;

  // State Tabs
  const [activeTab, setActiveTab] = useState<"registered" | "saved">("registered");
  const [selectedTicket, setSelectedTicket] = useState<RegisteredEvent | null>(null);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [submittedEvent, setSubmittedEvent] = useState<Event | null>(null);
  const [submittedEvents, setSubmittedEvents] = useState<Event[]>([]);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const [reminders, setReminders] = useState<Record<string, ReminderTrigger>>({});
  const [registeredEvents, setRegisteredEvents] = useState(currentUser.registeredEvents);
  const [registeredEventStatuses, setRegisteredEventStatuses] = useState<Record<string, Event["status"]>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadProfileEvents() {
      try {
        const storedSubmissions = getSubmittedEvents();
        const allEvents = await apiGetEvents({ status: "Semua" });
        const databaseSubmissions = allEvents.filter(
          (event) => event.organizer.trim().toLowerCase() === submissionOrganizer.trim().toLowerCase()
        );
        const submissionMap = new Map(
          [...storedSubmissions, ...databaseSubmissions].map((event) => [event.id, event])
        );
        const submissions = Array.from(submissionMap.values());
        const submissionIds = submissions.map((submission) => submission.id);
        const tickets = getRegisteredTickets();
        const ticketEvents = await Promise.all(
          tickets.map(async (ticket) => {
            try {
              return await apiGetEventById(ticket.eventId);
            } catch (err) {
              if (err instanceof Error && err.message === "Event tidak ditemukan.") return null;
              throw err;
            }
          })
        );
        const validTicketEntries = ticketEvents
          .map((event, index) => ({ event, ticket: tickets[index] }))
          .filter((entry): entry is { event: Event; ticket: RegisteredEvent } => entry.event !== null);
        const removedTicketIds = tickets
          .filter((ticket, index) => ticketEvents[index] === null)
          .map((ticket) => ticket.eventId);
        if (removedTicketIds.length > 0) {
          removeRegisteredTickets(removedTicketIds);
        }
        if (isMounted) {
          setRegisteredEvents(validTicketEntries.map((entry) => entry.ticket));
          setRegisteredEventStatuses(
            Object.fromEntries(
              validTicketEntries.map(({ ticket, event }) => [ticket.eventId, event.status])
            )
          );
        }

        const wishlistEvents = await Promise.all(
          getWishlistIds().map(async (eventId) => {
            try {
              return await apiGetEventById(eventId);
            } catch (err) {
              if (err instanceof Error && err.message === "Event tidak ditemukan.") {
                toggleWishlist(eventId);
                return null;
              }
              throw err;
            }
          })
        );
        if (isMounted) {
          const validWishlistEvents = wishlistEvents.filter((event): event is Event => event !== null);
          setSavedEvents(validWishlistEvents);
          setReminders(getReminderPreferences());
        }

        const latestSubmissions = await Promise.all(
          submissionIds.map(async (submissionId) => {
            try {
              return await apiGetEventById(submissionId);
            } catch (err) {
              if (err instanceof Error && err.message === "Event tidak ditemukan.") return null;
              throw err;
            }
          })
        );
        const validSubmissions = latestSubmissions.filter((event): event is Event => event !== null);
        if (isMounted) {
          setSubmittedEvents(validSubmissions);
          setSubmittedEvent(validSubmissions[0] || null);
          if (validSubmissions.length > 0) {
            localStorage.setItem("eventhub_submissions", JSON.stringify(validSubmissions));
            localStorage.setItem("eventhub_last_submission", JSON.stringify(validSubmissions[0]));
          }
        }
      } catch (err) {
        console.error("Gagal memuat data profil:", err);
      }
    }

    const refreshProfileEvents = () => {
      void loadProfileEvents();
    }

    loadProfileEvents();
    const unsubscribeTickets = subscribeToTickets(() => {
      void loadProfileEvents();
    });
    const unsubscribeWishlist = subscribeToWishlist(() => {
      void loadProfileEvents();
    });
    window.addEventListener("focus", refreshProfileEvents);
    document.addEventListener("visibilitychange", refreshProfileEvents);

    return () => {
      isMounted = false;
      unsubscribeTickets();
      unsubscribeWishlist();
      window.removeEventListener("focus", refreshProfileEvents);
      document.removeEventListener("visibilitychange", refreshProfileEvents);
    };
  }, [submissionOrganizer]);

  const toggleReminder = (event: Event, trigger: ReminderTrigger | null) => {
    setReminderPreference(event.id, trigger);
    setReminders(getReminderPreferences());
    if (trigger) {
      addNotification({
        id: `reminder-created-${event.id}-${trigger}`,
        role: "user",
        title: "Reminder berhasil dibuat",
        message: `Reminder berhasil dibuat untuk ${event.title}.`,
        href: `/event/${event.id}`,
      });
    }
  };

  const submissionStatus = submittedEvent?.status || "pending_review";
  const submissionStatusLabels: Record<string, string> = {
    pending_review: "Menunggu Review",
    needs_revision: "Perlu Perbaikan",
    rejected: "Ditolak",
    active: "Aktif",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  const submissionStatusColors: Record<string, string> = {
    pending_review: "bg-amber-100 text-amber-800",
    needs_revision: "bg-orange-100 text-orange-800",
    rejected: "bg-red-100 text-red-800",
    active: "bg-emerald-100 text-emerald-800",
    completed: "bg-slate-100 text-slate-700",
    cancelled: "bg-rose-100 text-rose-800",
  };
  const isSubmissionPublic = ["active", "completed", "cancelled"].includes(submissionStatus);

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
      {submittedEvent && (
        <section className="bg-white border border-gray-300 rounded-xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pengajuan Event Terakhir</span>
              <h2 className="mt-1 text-base font-bold text-gray-900">{submittedEvent.title}</h2>
              <p className="mt-1 text-xs text-gray-500">
                {isSubmissionPublic
                  ? "Status event telah diperbarui oleh admin."
                  : "Event belum tampil di katalog sebelum disetujui admin."}
              </p>
            </div>
            <span className={`w-fit px-3 py-1 rounded-full text-xs font-bold ${submissionStatusColors[submissionStatus] || "bg-gray-100 text-gray-700"}`}>
              {submissionStatusLabels[submissionStatus] || submissionStatus}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["active", "rejected", "completed", "cancelled"].includes(submissionStatus) && (
              <Link
                href={`/event/${encodeURIComponent(submittedEvent.id)}`}
                className="inline-flex w-fit px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-md hover:bg-gray-800 transition"
              >
                Lihat Detail Event
              </Link>
            )}
            {["needs_revision", "pending_review"].includes(submissionStatus) && (
              <Link
                href={`/pengajuan-event?edit=${encodeURIComponent(submittedEvent.id)}`}
                className="inline-flex w-fit px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-md hover:bg-gray-800 transition"
              >
                {submissionStatus === "needs_revision" ? "Edit Pengajuan Event" : "Ubah Pengajuan Event"}
              </Link>
            )}
          </div>
          {submittedEvents.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllSubmissions((current) => !current)}
              className="mt-4 text-xs font-bold text-gray-700 underline"
            >
              {showAllSubmissions ? "Sembunyikan Pengajuan Lain" : `Tampilkan Semua Pengajuan (${submittedEvents.length})`}
            </button>
          )}
          {showAllSubmissions && submittedEvents.slice(1).map((submission) => {
            const status = submission.status || "pending_review";
            const isPublic = ["active", "completed", "cancelled"].includes(status);
            return (
              <div key={submission.id} className="mt-4 border-t border-gray-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{submission.title}</h3>
                  <span className={`mt-1 inline-block px-2 py-1 rounded-full text-[11px] font-bold ${submissionStatusColors[status] || "bg-gray-100 text-gray-700"}`}>
                    {submissionStatusLabels[status] || status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isPublic && <Link href={`/event/${encodeURIComponent(submission.id)}`} className="px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-md">Lihat Detail Event</Link>}
                  {!isPublic && status !== "rejected" && <Link href={`/pengajuan-event?edit=${encodeURIComponent(submission.id)}`} className="px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-md">Edit Pengajuan</Link>}
                </div>
              </div>
            );
          })}
        </section>
      )}

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
              Event Diikuti ({registeredEvents.length})
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

              {registeredEvents.map((ticket) => (
                (() => {
                  const eventStatus = registeredEventStatuses[ticket.eventId];
                  const isClosed = eventStatus === "completed" || eventStatus === "cancelled";
                  return (
                <div
                  key={ticket.ticketId}
                  className="p-4 sm:p-5 border border-gray-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/40 hover:border-gray-400 transition"
                >
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-800">
                        {ticket.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isClosed ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {isClosed ? "Event Selesai" : `Tiket Aktif #${ticket.ticketId}`}
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
                    {!isClosed && (
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gray-900 text-white font-bold text-xs rounded-md hover:bg-gray-800 transition cursor-pointer text-center"
                      >
                        Lihat E-Ticket QR
                      </button>
                    )}
                    <Link
                      href={`/event/${ticket.eventId}`}
                      className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 bg-white text-gray-700 font-semibold text-xs rounded-md hover:bg-gray-50 transition text-center"
                    >
                      Detail Event
                    </Link>
                  </div>
                </div>
                  );
                })()
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

                  <div className="flex w-full sm:w-auto flex-wrap justify-end gap-2 shrink-0">
                    <select
                      value={reminders[evt.id] || ""}
                      onChange={(event) => toggleReminder(evt, (event.target.value || null) as ReminderTrigger | null)}
                      className="px-2 py-2 border border-gray-300 rounded-md text-xs text-gray-700"
                      aria-label={`Pilih trigger pengingat ${evt.title}`}
                    >
                      <option value="">Tanpa Pengingat</option>
                      <option value="7d">7 hari sebelum deadline</option>
                      <option value="3d">3 hari sebelum deadline</option>
                      <option value="1d">1 hari sebelum deadline</option>
                      <option value="1h">1 jam sebelum event</option>
                    </select>
                    <Link
                      href={`/event/${evt.id}`}
                      className="px-4 py-2 bg-gray-900 text-white font-semibold text-xs rounded-md hover:bg-gray-800 transition text-center"
                    >
                      Lihat Detail &rarr;
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(evt.id)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 font-semibold text-xs rounded-md hover:bg-gray-50 transition"
                    >
                      Hapus
                    </button>
                  </div>
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
