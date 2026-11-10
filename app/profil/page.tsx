"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGetEventById, apiGetEvents } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { RegisteredEvent, Event } from "@/types";
import { getWishlistIds, subscribeToWishlist, toggleWishlist } from "@/lib/wishlist";
import {
  getReminderPreferences,
  ReminderTrigger,
  setReminderPreference,
} from "@/lib/notifications";
import { getRegisteredTickets, removeRegisteredTickets, subscribeToTickets } from "@/lib/tickets";
import { getSubmittedEvents } from "@/lib/submissions";

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoading: isAuthLoading, updateProfile } = useAuth();

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);

  // State Tabs
  const [activeTab, setActiveTab] = useState<"registered" | "saved">("registered");
  const [selectedTicket, setSelectedTicket] = useState<RegisteredEvent | null>(null);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [submittedEvent, setSubmittedEvent] = useState<Event | null>(null);
  const [submittedEvents, setSubmittedEvents] = useState<Event[]>([]);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const [reminders, setReminders] = useState<Record<string, ReminderTrigger>>({});
  const [registeredEventStatuses, setRegisteredEventStatuses] = useState<Record<string, Event["status"]>>({});

  // Edit Profile States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUniversity, setEditUniversity] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !authUser) router.replace("/login");
  }, [authUser, isAuthLoading, router]);

  useEffect(() => {
    const authenticatedUser = authUser;
    if (isAuthLoading || !authenticatedUser) return;
    let isMounted = true;
    const userId = authenticatedUser.id;
    const submissionOrganizer = authenticatedUser.name;
    async function loadProfileEvents() {
      try {
        const storedSubmissions = getSubmittedEvents(userId);
        const allEvents = await apiGetEvents({ status: "Semua" });
        const databaseSubmissions = allEvents.filter(
          (event) => event.organizer.trim().toLowerCase() === submissionOrganizer.trim().toLowerCase()
        );
        const submissionMap = new Map(
          [...storedSubmissions, ...databaseSubmissions].map((event) => [event.id, event])
        );
        const submissions = Array.from(submissionMap.values());
        const submissionIds = submissions.map((submission) => submission.id);
        const tickets = getRegisteredTickets(userId);
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
          removeRegisteredTickets(userId, removedTicketIds);
        }

        // Hapus tiket jika event diselenggarakan oleh pengguna itu sendiri
        const ownEventTicketIds = validTicketEntries
          .filter(
            ({ event }) =>
              event.createdBy === userId ||
              (!event.createdBy && event.organizer.trim().toLowerCase() === submissionOrganizer.trim().toLowerCase())
          )
          .map(({ ticket }) => ticket.eventId);

        if (ownEventTicketIds.length > 0) {
          removeRegisteredTickets(userId, ownEventTicketIds);
        }

        const allowedTicketEntries = validTicketEntries.filter(
          (entry) => !ownEventTicketIds.includes(entry.ticket.eventId)
        );

        if (isMounted) {
          setRegisteredEvents(allowedTicketEntries.map((entry) => entry.ticket));
          setRegisteredEventStatuses(
            Object.fromEntries(
              allowedTicketEntries.map(({ ticket, event }) => [ticket.eventId, event.status])
            )
          );
        }

        const wishlistEvents = await Promise.all(
          getWishlistIds(userId).map(async (eventId) => {
            try {
              return await apiGetEventById(eventId);
            } catch (err) {
              if (err instanceof Error && err.message === "Event tidak ditemukan.") {
                toggleWishlist(userId, eventId);
                return null;
              }
              throw err;
            }
          })
        );
        if (isMounted) {
          const validWishlistEvents = wishlistEvents.filter((event): event is Event => event !== null);
          setSavedEvents(validWishlistEvents);
          setReminders(getReminderPreferences(userId));
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
      } finally {
        if (isMounted) setIsProfileLoading(false);
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
  }, [authUser, isAuthLoading]);

  const toggleReminder = (event: Event, trigger: ReminderTrigger | null) => {
    if (!authUser?.id) return;
    setReminderPreference(authUser.id, event.id, trigger);
    setReminders(getReminderPreferences(authUser.id));
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
    completed: "bg-[#EAE2D4] text-[#29374A]",
    cancelled: "bg-rose-100 text-rose-800",
  };
  const isSubmissionPublic = ["active", "completed", "cancelled"].includes(submissionStatus);

  const openEditModal = () => {
    if (!authUser) return;
    setEditName(authUser.name || "");
    setEditEmail(authUser.email || "");
    setEditUniversity(authUser.university || "");
    setEditAvatarFile(null);
    setEditAvatarPreview(authUser.avatarUrl || "");
    setProfileError(null);
    setProfileSuccess(null);
    setIsEditModalOpen(true);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Ukuran foto maksimal 5 MB.");
      return;
    }
    setEditAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setEditAvatarPreview(objectUrl);
    setProfileError(null);
  };

  const handleRemoveAvatar = () => {
    setEditAvatarFile(null);
    setEditAvatarPreview("");
  };

  const uploadOrConvertAvatar = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.url) return data.url;
      }
    } catch {
      // Fallback ke data URL jika upload storage gagal / belum dikonfigurasi
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    if (!editName.trim()) {
      setProfileError("Nama lengkap wajib diisi.");
      return;
    }
    if (!editEmail.trim()) {
      setProfileError("Email wajib diisi.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);

    try {
      let finalAvatarUrl: string | null = null;

      if (editAvatarFile) {
        finalAvatarUrl = await uploadOrConvertAvatar(editAvatarFile);
      } else if (editAvatarPreview) {
        finalAvatarUrl = authUser.avatarUrl || null;
      } else {
        finalAvatarUrl = null;
      }

      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        university: editUniversity.trim() || null,
        avatarUrl: finalAvatarUrl,
      });

      setProfileSuccess("Profil berhasil diperbarui!");
      setTimeout(() => {
        setProfileSuccess(null);
        setIsEditModalOpen(false);
      }, 1000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Gagal menyimpan perubahan profil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isAuthLoading || !authUser || isProfileLoading) {
    return (
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-10 flex flex-col gap-8 bg-[#F7F4EE]">
        <div className="bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl p-6 sm:p-8 animate-pulse">
          <div className="h-6 w-48 rounded bg-[#E4DCCF]" />
          <div className="mt-3 h-4 w-72 rounded bg-[#F0E9DC]" />
        </div>
        <div className="bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl p-6 animate-pulse">
          <div className="h-5 w-56 rounded bg-[#E4DCCF]" />
          <div className="mt-5 h-24 rounded bg-[#F0E9DC]" />
          <div className="mt-4 h-24 rounded bg-[#F0E9DC]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-10 flex flex-col gap-8 bg-[#F7F4EE]">
      {/* Profile Header Card - Matching profil.html */}
      <div className="card-royal border rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#E4DCCF] bg-[#315E9E] text-white font-bold text-3xl flex items-center justify-center shrink-0 relative shadow-sm">
            {authUser.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={authUser.avatarUrl}
                alt={authUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {authUser.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold card-heading-royal">
                {authUser.name}
              </h1>
              {authUser.role === "user" && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Pengguna
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6F7580]">
              {authUser.email}
            </p>
            <p className="text-xs text-[#6F7580] font-medium">
              {authUser.university || "Universitas belum diisi"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={openEditModal}
            className="px-4 py-2.5 bg-[#FFFCF6] border border-[#E4DCCF] hover:bg-[#F0E9DC] text-[#29374A] font-semibold text-xs sm:text-sm rounded-md transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <svg className="w-4 h-4 text-[#29374A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Profil
          </button>

          {authUser?.role === "admin" && (
            <Link
              href="/dashboard"
              className="px-4 py-2.5 bg-[#315E9E] text-white font-semibold text-xs sm:text-sm rounded-md hover:bg-[#244777] transition cursor-pointer shadow-xs"
            >
              Masuk ke Dashboard Admin &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      {submittedEvent && (
        <section className="card-coral border rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#92959C]">Pengajuan Event Terakhir</span>
              <h2 className="mt-1 text-base font-bold card-heading-coral">{submittedEvent.title}</h2>
              <p className="mt-1 text-xs text-[#6F7580]">
                {isSubmissionPublic
                  ? "Status event telah diperbarui oleh admin."
                  : "Event belum tampil di katalog sebelum disetujui admin."}
              </p>
            </div>
            <span className={`w-fit px-3 py-1 rounded-full text-xs font-bold ${submissionStatusColors[submissionStatus] || "bg-[#F0E9DC] text-[#29374A]"}`}>
              {submissionStatusLabels[submissionStatus] || submissionStatus}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["active", "rejected", "completed", "cancelled"].includes(submissionStatus) && (
              <Link
                href={`/event/${encodeURIComponent(submittedEvent.id)}`}
                className="inline-flex w-fit px-4 py-2 bg-[#315E9E] text-white text-xs font-bold rounded-md hover:bg-[#244777] transition"
              >
                Lihat Detail Event
              </Link>
            )}
            {["needs_revision", "pending_review"].includes(submissionStatus) && (
              <Link
                href={`/pengajuan-event?edit=${encodeURIComponent(submittedEvent.id)}`}
                className="inline-flex w-fit px-4 py-2 bg-[#315E9E] text-white text-xs font-bold rounded-md hover:bg-[#244777] transition"
              >
                {submissionStatus === "needs_revision" ? "Edit Pengajuan Event" : "Ubah Pengajuan Event"}
              </Link>
            )}
          </div>
          {submittedEvents.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllSubmissions((current) => !current)}
              className="mt-4 text-xs font-bold text-[#29374A] underline"
            >
              {showAllSubmissions ? "Sembunyikan Pengajuan Lain" : `Tampilkan Semua Pengajuan (${submittedEvents.length})`}
            </button>
          )}
          {showAllSubmissions && submittedEvents.slice(1).map((submission) => {
            const status = submission.status || "pending_review";
            const isPublic = ["active", "completed", "cancelled"].includes(status);
            return (
              <div key={submission.id} className="mt-4 border-t border-[#E4DCCF] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#29374A]">{submission.title}</h3>
                  <span className={`mt-1 inline-block px-2 py-1 rounded-full text-[11px] font-bold ${submissionStatusColors[status] || "bg-[#F0E9DC] text-[#29374A]"}`}>
                    {submissionStatusLabels[status] || status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isPublic && <Link href={`/event/${encodeURIComponent(submission.id)}`} className="px-3 py-2 bg-[#315E9E] text-white text-xs font-bold rounded-md">Lihat Detail Event</Link>}
                  {!isPublic && status !== "rejected" && <Link href={`/pengajuan-event?edit=${encodeURIComponent(submission.id)}`} className="px-3 py-2 bg-[#315E9E] text-white text-xs font-bold rounded-md">Edit Pengajuan</Link>}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Column: Interactive Tabs Container */}
        <div className="flex-1 w-full bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl shadow-xs overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-[#E4DCCF] text-xs sm:text-sm font-bold bg-[#F7F4EE]/50">
            <button
              type="button"
              onClick={() => setActiveTab("registered")}
              className={`flex-1 py-3.5 px-4 text-center border-b-2 transition cursor-pointer ${
                activeTab === "registered"
                  ? "border-[#244777] text-[#29374A] bg-[#FFFCF6]"
                  : "border-transparent text-[#6F7580] hover:text-[#29374A]"
              }`}
            >
              Event Diikuti ({registeredEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`flex-1 py-3.5 px-4 text-center border-b-2 transition cursor-pointer ${
                activeTab === "saved"
                  ? "border-[#244777] text-[#29374A] bg-[#FFFCF6]"
                  : "border-transparent text-[#6F7580] hover:text-[#29374A]"
              }`}
            >
              Disimpan ({savedEvents.length})
            </button>
          </div>

          {/* Tab 1: Event Diikuti (E-Tickets) */}
          {activeTab === "registered" && (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE5DA]">
                <span className="text-xs font-bold text-[#92959C] uppercase tracking-wider">
                  TIKET PENDAFTARAN RESMI
                </span>
                <span className="text-xs text-[#6F7580]">Klik &quot;Lihat E-Ticket&quot; untuk menampilkan barcode QR</span>
              </div>

              {registeredEvents.map((ticket) => (
                (() => {
                  const eventStatus = registeredEventStatuses[ticket.eventId];
                  const isClosed = eventStatus === "completed" || eventStatus === "cancelled";
                  return (
                <div
                  key={ticket.ticketId}
                  className="p-4 sm:p-5 border border-[#E4DCCF] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F7F4EE]/40 hover:border-[#B9B2A7] transition"
                >
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E4DCCF] text-[#29374A]">
                        {ticket.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isClosed ? "bg-[#EAE2D4] text-[#29374A]" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {isClosed ? "Event Selesai" : `Tiket Aktif #${ticket.ticketId}`}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#29374A] leading-snug">
                      {ticket.eventTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#6F7580] mt-1">
                      <span className="flex items-center gap-1"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></svg>{ticket.date}</span>
                      <span className="flex items-center gap-1"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2.5" /></svg>{ticket.time}</span>
                      <span className="flex items-center gap-1"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></svg>{ticket.location}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                    {!isClosed && (
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-[#315E9E] text-white font-bold text-xs rounded-md hover:bg-[#244777] transition cursor-pointer text-center"
                      >
                        Lihat E-Ticket QR
                      </button>
                    )}
                    <Link
                      href={`/event/${ticket.eventId}`}
                      className="flex-1 sm:flex-none px-4 py-2 border border-[#E4DCCF] bg-[#FFFCF6] text-[#29374A] font-semibold text-xs rounded-md hover:bg-[#F7F4EE] transition text-center"
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
              <span className="text-xs font-bold text-[#92959C] uppercase tracking-wider pb-2 border-b border-[#ECE5DA]">
                EVENT YANG DISIMPAN KE WISHLIST
              </span>

              {savedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 border border-[#E4DCCF] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FFFCF6] hover:border-[#B9B2A7] transition"
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0E9DC] text-[#29374A] border border-[#E4DCCF]">
                        {evt.category}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {evt.price === 0 ? "Gratis" : `Rp ${evt.price.toLocaleString("id-ID")}`}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#29374A]">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-[#6F7580]">
                      <span className="inline-flex items-center gap-1"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></svg>{evt.date}</span> &bull; <span className="inline-flex items-center gap-1"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></svg>{evt.location}</span>
                    </p>
                  </div>

                  <div className="flex w-full sm:w-auto flex-wrap justify-end gap-2 shrink-0">
                    <select
                      value={reminders[evt.id] || ""}
                      onChange={(event) => toggleReminder(evt, (event.target.value || null) as ReminderTrigger | null)}
                      className="px-2 py-2 border border-[#E4DCCF] rounded-md text-xs text-[#29374A]"
                      aria-label={`Pilih trigger pengingat ${evt.title}`}
                    >
                      <option value="">Tanpa Pengingat</option>
                      <option value="7d">7 hari sebelum event</option>
                      <option value="3d">3 hari sebelum event</option>
                      <option value="1d">1 hari sebelum event</option>
                    </select>
                    <Link
                      href={`/event/${evt.id}`}
                      className="px-4 py-2 bg-[#315E9E] text-white font-semibold text-xs rounded-md hover:bg-[#244777] transition text-center"
                    >
                      Lihat Detail &rarr;
                    </Link>
                    <button
                      type="button"
                      onClick={() => { if (authUser?.id) toggleWishlist(authUser.id, evt.id); }}
                      className="px-3 py-2 border border-[#E4DCCF] text-[#29374A] font-semibold text-xs rounded-md hover:bg-[#F7F4EE] transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Informasi pengguna */}
        <aside className="w-full lg:w-80 bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl p-6 shadow-xs flex flex-col gap-5 shrink-0">
          <div className="pt-2">
            <Link
              href="/event"
              className="w-full py-2.5 bg-[#315E9E] text-white text-xs font-bold rounded-md hover:bg-[#244777] transition block text-center"
            >
              Cari Event Lainnya &rarr;
            </Link>
          </div>
        </aside>
      </div>

      {/* Modal E-Ticket QR Code */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center gap-5 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between w-full border-b border-[#E4DCCF] pb-3">
              <span className="text-xs font-bold text-[#92959C] uppercase">E-TICKET RESMI</span>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-[#92959C] hover:text-[#6F7580] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-[#29374A]">
                {selectedTicket.eventTitle}
              </h3>
              <span className="text-xs text-[#6F7580]">
                {selectedTicket.date} &bull; {selectedTicket.time}
              </span>
            </div>

            {/* Mock QR Image */}
            <div className="p-3 bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl shadow-xs">
              <div className="relative w-44 h-44">
                <Image
                  src={selectedTicket.qrCodeMock || "https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=EVENTHUB-TIKET"}
                  alt={`QR Code ${selectedTicket.ticketId}`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full p-3 bg-[#F7F4EE] rounded-lg border border-[#E4DCCF] text-xs">
              <div className="flex justify-between">
                <span className="text-[#6F7580]">Nomor Tiket:</span>
                <span className="font-mono font-bold text-[#29374A]">#{selectedTicket.ticketId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7580]">Peserta:</span>
                <span className="font-semibold text-[#29374A]">{authUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7580]">Lokasi:</span>
                <span className="text-[#29374A] truncate max-w-[170px]">{selectedTicket.location}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                alert(`Mengunduh E-Ticket #${selectedTicket.ticketId}... Tiket siap dicetak atau ditunjukkan di HP.`);
                setSelectedTicket(null);
              }}
              className="w-full py-2.5 bg-[#315E9E] text-white font-bold text-xs rounded-md hover:bg-[#244777] transition cursor-pointer"
            >
              Unduh / Cetak Tiket (PDF)
            </button>
          </div>
        </div>
      )}

      {/* Modal Edit Profil Pengguna */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl max-w-lg w-full p-6 sm:p-7 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E4DCCF] pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#315E9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <h2 className="text-base font-bold text-[#29374A]">Edit Profil Pengguna</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#92959C] hover:text-[#29374A] cursor-pointer text-sm font-bold p-1"
                aria-label="Tutup modal edit profil"
              >
                ✕
              </button>
            </div>

            {profileError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md">
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 text-xs">
              {/* Foto Profil */}
              <div className="flex flex-col gap-2 p-3.5 bg-[#F7F4EE] border border-[#E4DCCF] rounded-lg">
                <span className="font-bold text-[#29374A] uppercase tracking-wide text-[11px]">
                  Foto Profil
                </span>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E4DCCF] bg-[#315E9E] text-white font-bold text-xl flex items-center justify-center shrink-0 relative shadow-xs">
                    {editAvatarPreview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={editAvatarPreview}
                        alt="Preview Foto Profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{(editName || authUser.name).slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 bg-[#FFFCF6] border border-[#E4DCCF] hover:bg-[#F0E9DC] text-[#29374A] font-semibold text-xs rounded-md transition w-fit shadow-xs">
                      <span>Unggah Foto Baru</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                    </label>
                    <span className="text-[10px] text-[#6F7580]">
                      Format JPG, PNG, WEBP, atau GIF (Maks. 5 MB).
                    </span>
                    {editAvatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="text-[11px] text-red-600 hover:text-red-800 font-semibold w-fit text-left cursor-pointer"
                      >
                        Hapus Foto Profil
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-name" className="font-bold text-[#29374A]">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="px-3.5 py-2.5 bg-[#FFFCF6] border border-[#E4DCCF] rounded-md text-[#29374A] focus:outline-none focus:border-[#315E9E] transition"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-email" className="font-bold text-[#29374A]">
                  Email Akun <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-email"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="px-3.5 py-2.5 bg-[#FFFCF6] border border-[#E4DCCF] rounded-md text-[#29374A] focus:outline-none focus:border-[#315E9E] transition"
                />
              </div>

              {/* Universitas / Instansi */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-univ" className="font-bold text-[#29374A]">
                  Universitas / Instansi
                </label>
                <input
                  id="edit-univ"
                  type="text"
                  value={editUniversity}
                  onChange={(e) => setEditUniversity(e.target.value)}
                  placeholder="Contoh: Universitas Indonesia"
                  className="px-3.5 py-2.5 bg-[#FFFCF6] border border-[#E4DCCF] rounded-md text-[#29374A] focus:outline-none focus:border-[#315E9E] transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4DCCF]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingProfile}
                  className="px-4 py-2 bg-[#FFFCF6] border border-[#E4DCCF] text-[#6F7580] hover:text-[#29374A] rounded-md font-semibold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 bg-[#315E9E] hover:bg-[#244777] text-white rounded-md font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
