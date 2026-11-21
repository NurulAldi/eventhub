"use client";

import { use, useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGetEventById, apiGetEvents, apiRegisterEvent, apiGetUserRegistrations, apiGetNotificationPreferences } from "@/lib/api";
import type { DescriptionBlock } from "@/types";
import { useAuth } from "@/context/AuthContext";
import EventCard from "@/components/EventCard";
import { Event, RegisteredEvent } from "@/types";
import { isEventInWishlist, subscribeToWishlist, toggleWishlist } from "@/lib/wishlist";
import { getPopularityLabel } from "@/lib/event-popularity";
import { addRegisteredTicket, getRegisteredTickets, isEventRegistered, removeRegisteredTickets, subscribeToTickets } from "@/lib/tickets";
import {
  getReminderPreferences,
  setReminderPreference,
  subscribeToNotifications,
  type ReminderTrigger,
} from "@/lib/notifications";

type Props = {
  params: Promise<{ id: string }>;
};

type TabType = "deskripsi" | "persyaratan" | "jadwal" | "kontak";

function EventDetailContent({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);
  const { user, isLoggedIn } = useAuth();

  // State
  const [event, setEvent] = useState<Event | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("deskripsi");

  // Interactive States
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredTicket, setRegisteredTicket] = useState<RegisteredEvent | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  const [reminderTrigger, setReminderTrigger] = useState<ReminderTrigger | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const fetchedEvent = await apiGetEventById(id);
        if (!isMounted) return;
        setEvent(fetchedEvent);
        if (user?.id) {
          setIsSaved(isEventInWishlist(user.id, fetchedEvent.id));
          const userTickets = getRegisteredTickets(user.id);
          const found = userTickets.find((ticket) => ticket.eventId === fetchedEvent.id);
          if (found) {
            setIsRegistered(true);
            setRegisteredTicket(found);
          } else {
            apiGetUserRegistrations()
              .then((serverTickets) => {
                if (isMounted) {
                  const sFound = serverTickets.find((t) => t.eventId === fetchedEvent.id);
                  if (sFound) {
                    setIsRegistered(true);
                    setRegisteredTicket(sFound);
                  }
                }
              })
              .catch(() => {});
          }
        }

        try {
          const all = await apiGetEvents({ category: fetchedEvent.category });
          if (isMounted) {
            setRelatedEvents(all.filter((e) => e.id !== fetchedEvent.id).slice(0, 3));
          }
        } catch {
          const fallbackEvents = await apiGetEvents();
          if (isMounted) {
            setRelatedEvents(fallbackEvents.filter((e) => e.id !== fetchedEvent.id).slice(0, 3));
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error loading event:", err);
        const errMsg = err instanceof Error ? err.message : "";
        if (errMsg.includes("tidak ditemukan") || errMsg.includes("404")) {
          setNotFound(true);
        } else {
          setError(errMsg || "Terjadi kesalahan saat memuat event dari database.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [id, user]);

  useEffect(() => {
    if (!event || !user) return;
    return subscribeToTickets(() => {
      setIsRegistered(isEventRegistered(user.id, event.id));
      setRegisteredTicket(getRegisteredTickets(user.id).find((ticket) => ticket.eventId === event.id) || null);
    });
  }, [event, user]);

  useEffect(() => {
    const unsubscribe = subscribeToWishlist(() => {
      if (event && user?.id) {
        const saved = isEventInWishlist(user.id, event.id);
        setIsSaved(saved);
        if (!saved) {
          setReminderSet(false);
          setReminderTrigger(null);
          setShowReminderOptions(false);
          setReminderPreference(user.id, event.id, null);
        }
      }
    });
    return unsubscribe;
  }, [event, user?.id]);

  useEffect(() => {
    if (!event || !user?.id) return;

    const syncReminder = () => {
      const trigger = getReminderPreferences(user.id)[event.id] || null;
      setReminderTrigger(trigger);
      setReminderSet(Boolean(trigger));
    };

    syncReminder();
    const unsubscribe = subscribeToNotifications(syncReminder);

    apiGetNotificationPreferences()
      .then((preferences) => {
        const trigger = preferences.eventReminders?.[event.id] || null;
        localStorage.setItem(
          `eventhub_reminder_preferences_${user.id}`,
          JSON.stringify(preferences.eventReminders || {})
        );
        setReminderTrigger(trigger);
        setReminderSet(Boolean(trigger));
      })
      .catch(() => {});

    return unsubscribe;
  }, [event, user?.id]);

  const isEventCreator = Boolean(
    user &&
      event && (
        event.createdBy === user.id ||
        event.organizer.trim().toLowerCase() === user.name.trim().toLowerCase()
      )
  );

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!event || !user) return;
    if ((isEventCreator || isAdmin) && isEventRegistered(user.id, event.id)) {
      removeRegisteredTickets(user.id, [event.id]);
    }
  }, [event, user, isEventCreator, isAdmin]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 h-96 bg-gray-200 rounded-2xl" />
            <div className="lg:col-span-7 h-96 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4 py-20 px-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="h-9 w-9 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
              <path strokeLinecap="round" strokeWidth="1.5" d="m20 20-4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Event Tidak Ditemukan</h1>
          <p className="text-sm text-gray-500 max-w-md">
            Event dengan ID &quot;{id}&quot; tidak ditemukan atau telah dihapus oleh penyelenggara.
          </p>
          <div className="flex gap-3 mt-2">
            <Link href="/event" className="px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition">
              Kembali ke Jelajahi Event
            </Link>
            <Link href="/" className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition">
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4 py-20 px-6">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl font-bold">!</div>
          <h1 className="text-xl font-bold text-gray-900">Gagal Memuat Detail Event</h1>
          <p className="text-sm text-red-600 max-w-md">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition cursor-pointer"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(event.date).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const priceDisplay = event.price === 0
    ? "Gratis"
    : `Rp ${event.price.toLocaleString("id-ID")}`;

  const registrationDeadlineFormatted = event.registrationDeadline
    ? new Date(`${event.registrationDeadline}T00:00:00`).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "Belum ditentukan";

  const isClosed = ["completed", "cancelled", "rejected"].includes(event.status || "");
  const popularityLabel = getPopularityLabel(event);

  const quota = event.quota || 1000;
  const registered = event.registeredCount || 0;
  const isQuotaFull = quota > 0 && registered >= quota;
  const registrationPercentage = Math.min(100, Math.round((registered / quota) * 100));

  const deadlineDaysLeft = (() => {
    if (!event.registrationDeadline) return null;
    const target = new Date(`${event.registrationDeadline}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const handleOpenRegistration = () => {
    if (isClosed) return;
    if (isRegistered || isEventCreator || isAdmin) return;
    if (!isLoggedIn) { router.push("/login"); return; }
    setShowModal(true);
    setRegistrationSuccess(false);
  };

  const handleConfirmRegistration = async () => {
    if (isRegistered || isEventCreator || isAdmin) return;
    try {
      const response = await apiRegisterEvent(event.id);
      const ticket: RegisteredEvent = response.ticket || {
        ticketId: `EVT-${Math.floor(100000 + Math.random() * 900000)}`,
        eventId: event.id,
        eventTitle: event.title,
        category: event.category,
        date: formattedDate,
        time: event.time || "Waktu belum ditentukan",
        location: event.location,
        registeredAt: new Date().toISOString().slice(0, 10),
        ticketStatus: "active",
        qrCodeMock: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=EVT-TICKET`,
      };
      if (user) {
        addRegisteredTicket(user.id, ticket);
      }
      setEvent(response);
      setTicketCode(ticket.ticketId);
      setRegisteredTicket(ticket);
      setIsRegistered(true);
      setRegistrationSuccess(true);
    } catch (registrationError) {
      alert(registrationError instanceof Error ? registrationError.message : "Pendaftaran event gagal.");
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "deskripsi", label: "Deskripsi" },
    { id: "persyaratan", label: "Persyaratan" },
    { id: "jadwal", label: "Jadwal" },
    { id: "kontak", label: "Kontak Penyelenggara" },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Breadcrumb Navigation - Sesuai Gambar 3 */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-700 transition flex items-center gap-1.5 text-blue-700 font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Beranda
          </Link>
          <span className="text-gray-300">/</span>
          <Link href={`/event?category=${encodeURIComponent(event.category)}`} className="hover:text-blue-700 transition">
            {event.category}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-semibold truncate max-w-xs sm:max-w-md">
            Detail Event
          </span>
        </nav>

        {/* Top Section: Poster Kiri & Info Box Kanan (2-Column Layout Sesuai Gambar 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
          
          {/* Kolom Kiri: Poster Poster Image */}
          <div className="lg:col-span-5 w-full">
            <div className="relative aspect-[4/3] sm:aspect-square lg:aspect-[4/3.8] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 shadow-md">
              <Image
                src={event.image}
                alt={event.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
              {/* Category Badge di atas poster */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3.5 py-1.5 bg-[#FBBF24] text-gray-900 font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-sm">
                  {event.category}
                </span>
              </div>
              {/* Logo EventHub di atas poster */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-white/40">
                <div className="w-5 h-5 rounded bg-blue-700 text-white flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2.5"/>
                    <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-bold text-gray-900">EventHub Kampus</span>
                  <span className="text-[8px] text-gray-500">Ide Hari Ini Untuk Masa Depan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Detail Informasi Lengkap */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* Badges Baris Atas */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {!isClosed && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Terverifikasi
                  </span>
                )}
                {popularityLabel && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
                    🔥 {popularityLabel}
                  </span>
                )}
                {isClosed && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                    Ditutup
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                🏆 {event.category}
              </span>
            </div>

            {/* Judul & Penyelenggara */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {event.title}
              </h1>
              <p className="mt-1.5 text-sm sm:text-base text-gray-600 font-medium">
                {event.organizer}
              </p>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Grid Informasi 2 Kolom x 3 Baris - Sesuai Gambar 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200/80">
              
              {/* 1. Diselenggarakan oleh */}
              <div className="flex items-start gap-3 p-1">
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-gray-400 block">Diselenggarakan oleh</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 truncate block">{event.organizer}</span>
                </div>
              </div>

              {/* 2. Deadline Pendaftaran */}
              <div className="flex items-start gap-3 p-1">
                <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-gray-400 block">Deadline Pendaftaran</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-gray-900">{registrationDeadlineFormatted}</span>
                    {deadlineDaysLeft !== null && deadlineDaysLeft > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {deadlineDaysLeft} hari lagi
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Tanggal Pelaksanaan */}
              <div className="flex items-start gap-3 p-1">
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-gray-400 block">Tanggal Pelaksanaan</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 block">{formattedDate}</span>
                </div>
              </div>

              {/* 4. Biaya Pendaftaran */}
              <div className="flex items-start gap-3 p-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-gray-400 block">Biaya Pendaftaran</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-700">{priceDisplay}</span>
                    {event.price === 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        100% didanai
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Lokasi */}
              <div className="flex items-start gap-3 p-1">
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-gray-400 block">Lokasi</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 block truncate">{event.location}</span>
                </div>
              </div>

              {/* 6. Kuota Peserta */}
              <div className="flex items-start gap-3 p-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="min-w-0 w-full">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-gray-400">Kuota Peserta</span>
                    <span className="font-semibold text-gray-600">{registered} dari {quota} peserta</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${registrationPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-blue-700 shrink-0">{registrationPercentage}% kuota terisi</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Tombol Aksi - Sesuai Gambar 3 */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isAdmin ? (
                <div className="w-full">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full py-3 bg-gray-100 text-gray-400 font-bold text-sm rounded-xl cursor-not-allowed text-center select-none border border-gray-200"
                    title="Akun dengan role Admin tidak dapat mendaftar event apapun"
                  >
                    Daftar Sekarang
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-1.5">
                    Akun dengan role Admin tidak dapat mendaftar event apapun.
                  </p>
                </div>
              ) : isEventCreator ? (
                <div className="w-full">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full py-3 bg-gray-100 text-gray-400 font-bold text-sm rounded-xl cursor-not-allowed text-center select-none border border-gray-200"
                    title="Penyelenggara tidak dapat mendaftar event sendiri"
                  >
                    Daftar Sekarang
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-1.5">
                    Anda adalah penyelenggara event ini (tidak dapat mendaftar).
                  </p>
                </div>
              ) : isLoggedIn && isRegistered ? (
                <button
                  type="button"
                  onClick={() => setShowTicketModal(true)}
                  className="flex-1 py-3 px-6 bg-blue-700 text-white font-bold text-sm rounded-xl hover:bg-blue-800 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Lihat E-Ticket QR (Terdaftar)
                </button>
              ) : isQuotaFull ? (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-3 px-6 bg-gray-200 text-gray-500 font-bold text-sm rounded-xl cursor-not-allowed select-none text-center"
                >
                  Kuota Penuh
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenRegistration}
                  disabled={isClosed}
                  className={`flex-1 py-3 px-6 font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                    isClosed
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-blue-700 hover:bg-blue-800 active:scale-98 text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {isClosed ? "Pendaftaran Ditutup" : "Daftar Sekarang"}
                </button>
              )}

              {/* Tombol Ingatkan Saya */}
              <div className="relative">
                <button
                  type="button"
                  disabled={!isSaved}
                  onClick={() => setShowReminderOptions((current) => !current)}
                  className={`py-3 px-5 border rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    !isSaved
                      ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : reminderSet
                        ? "border-amber-300 bg-amber-50 text-amber-800 cursor-pointer"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 cursor-pointer"
                  }`}
                  title={!isSaved ? "Simpan event terlebih dahulu untuk mengatur pengingat" : "Atur pengingat event"}
                >
                  <svg className={`w-4 h-4 ${reminderSet ? "text-amber-600 fill-amber-500" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {reminderSet ? "Pengingat Aktif" : "Ingatkan Saya"}
                </button>

                {showReminderOptions && isSaved && (
                  <select
                    autoFocus
                    value={reminderTrigger || ""}
                    onChange={(changeEvent) => {
                      if (!user?.id) return;
                      const value = changeEvent.target.value;
                      const trigger = value ? value as ReminderTrigger : null;
                      setReminderPreference(user.id, event.id, trigger);
                      setReminderTrigger(trigger);
                      setReminderSet(Boolean(trigger));
                      setShowReminderOptions(false);
                    }}
                    className="absolute right-0 mt-2 z-20 w-44 px-3 py-2 border border-gray-200 bg-white text-gray-700 text-xs font-semibold rounded-lg shadow-lg outline-none"
                    aria-label="Pilih pengingat event"
                  >
                    <option value="">Tanpa Pengingat</option>
                    <option value="7d">7 hari sebelum</option>
                    <option value="3d">3 hari sebelum</option>
                    <option value="1d">1 hari sebelum</option>
                  </select>
                )}
              </div>

              {/* Tombol Simpan Event (Wishlist) */}
              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    router.push("/login");
                    return;
                  }
                  if (user?.id) setIsSaved(toggleWishlist(user.id, event.id));
                }}
                className={`py-3 px-5 border rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                  isSaved
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                }`}
              >
                <svg className={`w-4 h-4 ${isSaved ? "text-blue-700 fill-blue-700" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {isSaved ? "Tersimpan" : "Simpan Event"}
              </button>
            </div>

          </div>
        </div>

        {/* Tab Navigation & Konten Detail - Sesuai Gambar 3 */}
        <div className="border-t border-gray-200 pt-8">
          
          {/* Tabs Menu */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-px mb-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-700 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {tab.id === "deskripsi" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {tab.id === "persyaratan" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                )}
                {tab.id === "jadwal" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
                {tab.id === "kontak" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Konten Tab Layout 2 Kolom: Kiri Konten Tab, Kanan Sidebar Kategori Inovasi */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Kiri: Konten Tab Dinamis */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {activeTab === "deskripsi" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Tentang Event</h2>
                    <div className="text-sm sm:text-base text-gray-600 leading-relaxed space-y-4">
                      {(event.descriptionBlocks?.length
                        ? event.descriptionBlocks
                        : [{ id: "legacy", type: "paragraph", content: event.description } as DescriptionBlock]
                      ).map((block) => {
                        if (block.type === "image") {
                          return (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={block.id}
                              src={block.content}
                              alt={block.alt || "Gambar deskripsi event"}
                              className="max-h-96 w-full rounded-2xl object-cover shadow-sm my-4"
                            />
                          );
                        }
                        const Tag = block.type === "paragraph" ? "p" : block.type === "heading1" ? "h3" : block.type === "heading2" ? "h4" : "h5";
                        return (
                          <Tag
                            key={block.id}
                            className={block.type === "paragraph" ? "text-gray-600" : "font-bold text-gray-900 text-lg mt-4"}
                          >
                            {block.content}
                          </Tag>
                        );
                      })}
                    </div>
                  </div>

                  {/* Banner Kutipan / Quote Card - Sesuai Gambar 3 */}
                  <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                        Bersama Ide Mahasiswa, Kita Wujudkan Indonesia yang Lebih Baik
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 italic mt-0.5">
                        &quot;Inovasi hari ini, perubahan nyata untuk masa depan.&quot;
                      </p>
                    </div>
                  </div>

                  {/* Fasilitas jika ada */}
                  {(event.facilities || []).length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Fasilitas & Benefit</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {event.facilities?.map((f, i) => (
                          <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              ✓
                            </span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "persyaratan" && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Persyaratan Peserta</h2>
                  <div className="space-y-3">
                    {(event.requirements && event.requirements.length > 0
                      ? event.requirements
                      : [
                          "Mahasiswa aktif jenjang D3/D4/S1 dibuktikan dengan Kartu Tanda Mahasiswa (KTM).",
                          "Melakukan registrasi online melalui platform EventHub Kampus.",
                          "Hadir 15 menit sebelum kegiatan dimulai dan mematuhi tata tertib kegiatan.",
                          "Bersedia mengikuti seluruh rangkaian acara sampai selesai.",
                        ]
                    ).map((req, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                        <span className="w-6 h-6 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-gray-700 leading-relaxed">{req}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "jadwal" && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Jadwal Pelaksanaan</h2>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                          <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900 text-sm">Waktu Pelaksanaan</h4>
                        <p className="text-sm text-blue-800 font-medium">{formattedDate}</p>
                        <p className="text-xs text-blue-600 mt-0.5">Pukul {event.time || "09:00 - Selesai WIB"}</p>
                      </div>
                    </div>

                    {event.registrationDeadline && (
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-900 text-sm">Batas Pendaftaran</h4>
                          <p className="text-sm text-amber-800 font-medium">{registrationDeadlineFormatted}</p>
                          <p className="text-xs text-amber-600 mt-0.5">Jangan sampai melewatkan deadline penting ini!</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "kontak" && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Kontak Penyelenggara</h2>
                  <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-sm">
                      {event.organizer.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900">{event.organizer}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Official Event Organizer</p>
                      <p className="text-xs text-gray-600 mt-2">
                        Penyelenggara terverifikasi di sistem EventHub Kampus. Pertanyaan dapat ditujukan melalui kanal resmi penyelenggara.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Kanan: Sidebar Kategori Inovasi - Sesuai Gambar 3 */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <h3 className="font-bold text-gray-900 text-base">Kategori Inovasi</h3>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      🌿
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Lingkungan & Keberlanjutan</span>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      ⚙️
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Teknologi & Digitalisasi</span>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      👥
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Sosial & Kesejahteraan Masyarakat</span>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      📖
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Pendidikan</span>
                  </div>
                </div>
              </div>

              {/* Box Bantuan / Ajukan Pertanyaan */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                <h4 className="text-sm font-bold text-gray-900">Butuh Informasi Tambahan?</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Hubungi tim bantuan jika Anda mengalami kendala saat melakukan pendaftaran.
                </p>
                <Link
                  href="/pengajuan-event"
                  className="mt-3 inline-block w-full py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Ajukan Pertanyaan
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Section: Event Terkait Lainnya */}
        {relatedEvents.length > 0 && (
          <div className="mt-16 pt-10 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Event Terkait Lainnya</h2>
                <p className="text-xs text-gray-500 mt-0.5">Kegiatan serupa yang mungkin menarik minatmu</p>
              </div>
              <Link href="/event" className="text-sm font-semibold text-blue-700 hover:text-blue-800 transition">
                Jelajahi Semua →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Ticket QR Modal */}
      {showTicketModal && registeredTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">E-Ticket QR Resmi</h3>
              <button type="button" onClick={() => setShowTicketModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm font-bold text-gray-900">{registeredTicket.eventTitle}</p>
              <Image
                src={registeredTicket.qrCodeMock || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${registeredTicket.ticketId}`}
                alt={`QR Code ${registeredTicket.ticketId}`}
                width={150} height={150}
                className="border border-gray-200 rounded-xl p-2 bg-white shadow-xs"
              />
              <span className="font-mono font-bold text-gray-900 text-base">#{registeredTicket.ticketId}</span>
              <p className="text-xs text-gray-500">{registeredTicket.date} • {registeredTicket.time}</p>
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="w-full mt-2 py-2.5 bg-blue-700 text-white text-xs font-bold rounded-lg hover:bg-blue-800 transition"
              >
                Tutup E-Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95">
            {!registrationSuccess ? (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900">
                    Konfirmasi {event.price === 0 ? "Pendaftaran" : "Pembelian Tiket"}
                  </h3>
                  <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
                </div>

                <div className="flex flex-col gap-3 text-sm">
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-1">
                    <span className="font-bold text-gray-900">{event.title}</span>
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      📅 {formattedDate}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      📍 {event.location}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Nama Pendaftar:</span>
                    <span className="font-semibold text-gray-900">{user?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Email Kampus:</span>
                    <span className="font-semibold text-gray-900">{user?.email || "-"}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-gray-500">Total Biaya:</span>
                    <span className={`font-extrabold text-base ${event.price === 0 ? "text-emerald-700" : "text-gray-900"}`}>{priceDisplay}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRegistration}
                    className="flex-1 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-bold hover:bg-blue-800 cursor-pointer transition"
                  >
                    Konfirmasi Sekarang
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">✓</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Pendaftaran Berhasil!</h3>
                  <p className="text-sm text-gray-500 mt-1">Tiket event telah diterbitkan dan tersimpan di akun Anda.</p>
                </div>
                <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <p className="text-xs text-gray-400 mb-1">KODE TIKET RESMI</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{ticketCode}</p>
                  <p className="text-xs text-gray-500 mt-1">Tunjukkan kode ini saat registrasi ulang</p>
                </div>
                <div className="flex gap-2 w-full">
                  <Link
                    href="/profil"
                    className="flex-1 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-bold hover:bg-blue-800 text-center transition"
                  >
                    Lihat di Profil Saya
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function EventDetailPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-sm text-gray-500">
          Memuat detail event...
        </div>
      }
    >
      <EventDetailContent params={params} />
    </Suspense>
  );
}
