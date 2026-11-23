"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGetEvents, apiGetAdminStats, apiDeleteEvent, apiUpdateEvent, apiCreateNotification } from "@/lib/api";
import { Event } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [eventList, setEventList] = useState<Event[]>([]);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  const [viewDetailEvent, setViewDetailEvent] = useState<Event | null>(null);
  const [revisionNote, setRevisionNote] = useState<{ event: Event; note: string } | null>(null);

  const loadAdminData = () => {
    Promise.all([apiGetEvents({ status: "Semua" }), apiGetAdminStats()])
      .then(([data, stats]) => {
        setEventList(data);
        setTotalUsers(stats.totalUsers);
        setError(null);
      })
      .catch((err) => {
        console.error("Gagal memuat event admin:", err);
        setError("Gagal mengambil data event dari database.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    loadAdminData();
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      router.replace("/");
    }
  }, [router, user?.role]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadAdminData();
  }, [refreshKey, user?.role]);

  if (user?.role !== "admin") return null;

  // Filter events based on search & category
  const filteredEvents = eventList.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.organizer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "Semua" ||
      evt.category.toLowerCase() === selectedCategory.toLowerCase();

    const isClosed = evt.status === "completed" || evt.status === "cancelled";
    const matchesStatus =
      selectedStatus === "Semua" ||
      (selectedStatus === "Buka" && !isClosed) ||
      (selectedStatus === "Tutup" && isClosed) ||
      selectedStatus === evt.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Action: Delete Event (API)
  const handleDeleteEvent = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus event "${title}" dari database?`)) {
      try {
        await apiDeleteEvent(id);
        setEventList((prev) => prev.filter((e) => e.id !== id));
        alert(`Event "${title}" berhasil dihapus.`);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal menghapus event.");
      }
    }
  };

  // Action: Submit Revision Note
  const handleSubmitRevisionNote = async () => {
    if (!revisionNote || !revisionNote.note.trim()) return;

    try {
      const updated = await apiUpdateEvent(revisionNote.event.id, {
        status: "needs_revision",
        rejectionReason: revisionNote.note.trim(),
      });
      setEventList((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));

      // Create notification for the user who submitted the event
      if (revisionNote.event.createdBy) {
        try {
          await apiCreateNotification(
            revisionNote.event.createdBy,
            "Event Perlu Diperbaiki",
            `Pengajuan event "${revisionNote.event.title}" memerlukan perbaikan. Silakan lihat catatan admin dan edit kembali pengajuan Anda.`,
            `/pengajuan-event?edit=${revisionNote.event.id}`
          );
        } catch (notifError) {
          console.error("Gagal membuat notifikasi:", notifError);
          // Don't fail the whole operation if notification fails
        }
      }

      setRevisionNote(null);
      setViewDetailEvent(null);
      alert("Event berhasil diubah ke status 'Perlu Perbaikan' dan catatan telah disimpan.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan catatan perbaikan.");
    }
  };

  const totalRegistrations = eventList.reduce(
    (sum, evt) => sum + (evt.registeredCount || 0),
    0
  );
  const activeEventsCount = eventList.filter((event) => event.status === "active").length;

  const statusColors: Record<string, string> = {
    pending_review: "bg-amber-50 text-amber-800 border-amber-200",
    needs_revision: "bg-orange-50 text-orange-800 border-orange-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
    active: "bg-emerald-50 text-emerald-800 border-emerald-200",
    completed: "bg-[#EAE2D4] text-[#29374A] border-[#E4DCCF]",
    cancelled: "bg-rose-50 text-rose-800 border-rose-200",
    draft: "bg-gray-50 text-gray-700 border-gray-200",
    approved: "bg-blue-50 text-blue-800 border-blue-200",
    published: "bg-cyan-50 text-cyan-800 border-cyan-200",
  };
  const statusLabels: Record<string, string> = {
    pending_review: "Menunggu Review",
    needs_revision: "Perlu Perbaikan",
    rejected: "Ditolak",
    active: "Aktif",
    completed: "Selesai",
    cancelled: "Dibatalkan",
    draft: "Draft",
    approved: "Disetujui",
    published: "Dipublikasikan",
  };

  return (
    <main className="flex-1 p-6 md:p-12 flex flex-col gap-8 bg-[#F7F4EE]">
      {/* Top Header - Matching dashboard-admin.html */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29374A] tracking-tight">
            Dashboard Ringkasan
          </h1>
          <p className="text-xs sm:text-sm text-[#6F7580]">
            Overview data platform EventHub Kampus hari ini (Database Real).
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="self-start sm:self-auto px-4 py-2 border border-[#E4DCCF] bg-[#FFFCF6] text-[#29374A] hover:bg-[#F0E9DC] rounded-md text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Segarkan Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshKey((k) => k + 1);
            }}
            className="text-xs font-bold underline cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* 4 Stat Cards Grid - Matching dashboard-admin.html */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 card-royal border rounded-lg shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-[#92959C] uppercase tracking-wider">
            Total Event
          </span>
          <div className="text-3xl font-extrabold card-heading-royal">
            {isLoading ? "..." : eventList.length}
          </div>
          <span className="text-[11px] card-text-royal font-medium">Terdaftar di PostgreSQL</span>
        </div>

        <div className="p-5 card-sage border rounded-lg shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-[#92959C] uppercase tracking-wider">
            Event Aktif
          </span>
          <div className="text-3xl font-extrabold card-heading-sage">
            {isLoading ? "..." : activeEventsCount}
          </div>
          <span className="text-[11px] card-text-sage font-medium">Pendaftaran terbuka</span>
        </div>

        <div className="p-5 card-sand border rounded-lg shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-[#92959C] uppercase tracking-wider">
            Total Pendaftar
          </span>
          <div className="text-3xl font-extrabold card-heading-sand">
            {isLoading ? "..." : totalRegistrations.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] card-text-sand font-medium">Tiket terakumulasi</span>
        </div>

        <div className="p-5 card-coral border rounded-lg shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
          <span className="text-xs font-bold text-[#92959C] uppercase tracking-wider">
            Total Pengguna
          </span>
          <div className="text-3xl font-extrabold card-heading-coral">
            {isLoading || totalUsers === null ? "..." : totalUsers.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] card-text-coral font-medium">Mahasiswa & organizer</span>
        </div>
      </div>

      {/* Main Table Card - Matching dashboard-admin.html */}
      <div className="bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4DCCF]">
          <h2 className="text-base sm:text-lg font-bold text-[#29374A]">
            Kelola Event Terkini
          </h2>

          {/* Interactive Table Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul event..."
                className="px-3 py-1.5 text-xs bg-[#F7F4EE] border border-[#E4DCCF] rounded-md focus:bg-[#FFFCF6] focus:outline-none focus:border-[#315E9E] w-44 sm:w-56 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1.5 text-xs text-[#92959C] hover:text-[#6F7580] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              aria-label="Filter Kategori"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#F7F4EE] border border-[#E4DCCF] rounded-md text-[#29374A] outline-none cursor-pointer focus:border-[#315E9E]"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Seminar">Seminar</option>
              <option value="Workshop">Workshop</option>
              <option value="Lomba">Lomba</option>
              <option value="Beasiswa">Beasiswa</option>
              <option value="Konser & Musik">Konser & Musik</option>
              <option value="Olahraga">Olahraga</option>
              <option value="Technopreneurship">Technopreneurship</option>
            </select>

            <select
              aria-label="Filter Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#F7F4EE] border border-[#E4DCCF] rounded-md text-[#29374A] outline-none cursor-pointer focus:border-[#315E9E]"
            >
              <option value="Semua">Semua Status</option>
              <option value="Buka">Buka (Aktif)</option>
              <option value="Tutup">Tutup (Selesai)</option>
              <option value="pending_review">Menunggu Review</option>
              <option value="needs_revision">Perlu Perbaikan</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#92959C] animate-pulse">
              Memuat data event dashboard...
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F7F4EE] border-b border-[#E4DCCF] text-[#6F7580] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Nama Event</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Tanggal Pelaksanaan</th>
                  <th className="py-3 px-4">Penyelenggara</th>
                  <th className="py-3 px-4 text-center">Pendaftar</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DCCF]">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((evt) => {
                    return (
                      <tr key={evt.id} className="hover:bg-[#F7F4EE]/80 transition">
                        <td className="py-3 px-4 font-semibold text-[#29374A] max-w-xs truncate">
                          <Link href={`/event/${evt.id}`} className="hover:underline">
                            {evt.title}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0E9DC] text-[#29374A] border border-[#E4DCCF]">
                            {evt.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6F7580] whitespace-nowrap">
                          {evt.date}
                        </td>
                        <td className="py-3 px-4 text-[#6F7580] truncate max-w-[150px]">
                          {evt.organizer}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[#29374A]">
                          {evt.registeredCount || 0} / {evt.quota || 100}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${statusColors[evt.status || "draft"]}`}>
                            {statusLabels[evt.status || "draft"]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setViewDetailEvent(evt)}
                              className="px-2 py-1 text-xs font-semibold text-[#29374A] hover:text-[#29374A] hover:bg-[#F0E9DC] rounded transition cursor-pointer"
                            >
                              Lihat Detail
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(evt.id, evt.title)}
                              className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#6F7580] text-xs">
                      Tidak ada data event yang sesuai dengan filter atau kata kunci pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Lihat Detail Event */}
      {viewDetailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4DCCF] pb-3 mb-4">
              <h3 className="text-base font-bold text-[#29374A]">
                Detail Event #{viewDetailEvent.id}
              </h3>
              <button
                type="button"
                onClick={() => setViewDetailEvent(null)}
                className="text-[#92959C] hover:text-[#6F7580] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs sm:text-sm">
              {/* Poster Image */}
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={viewDetailEvent.image}
                  alt={viewDetailEvent.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Judul Event</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.title}</p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Kategori</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0E9DC] text-[#29374A] border border-[#E4DCCF]">
                      {viewDetailEvent.category}
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Tanggal Pelaksanaan</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.date}</p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Waktu</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.time || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Lokasi</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.location}</p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Mode Event</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">
                    {viewDetailEvent.eventMode ? viewDetailEvent.eventMode.charAt(0).toUpperCase() + viewDetailEvent.eventMode.slice(1) : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Penyelenggara</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.organizer}</p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Tipe Penyelenggara</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.organizerType || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Institusi</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.institution || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Kontak Penyelenggara</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.organizerContact || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Status</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${statusColors[viewDetailEvent.status || "draft"]}`}>
                      {statusLabels[viewDetailEvent.status || "draft"]}
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Biaya</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">
                    {viewDetailEvent.price === 0 ? "Gratis" : `Rp ${viewDetailEvent.price.toLocaleString("id-ID")}`}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Kuota</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.quota || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#29374A]">Pendaftar</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.registeredCount || 0}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#29374A]">Deadline Pendaftaran</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.registrationDeadline || "-"}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#29374A]">Link Pendaftaran</label>
                  <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">
                    {viewDetailEvent.registrationUrl ? (
                      <a href={viewDetailEvent.registrationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {viewDetailEvent.registrationUrl}
                      </a>
                    ) : "-"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 pt-2 border-t border-[#E4DCCF]">
                <label className="font-bold text-[#29374A]">Deskripsi Event</label>
                <div className="prose prose-sm max-w-none bg-[#F7F4EE] p-4 rounded-md border border-[#E4DCCF] text-[#6F7580] whitespace-pre-wrap">
                  {viewDetailEvent.description}
                </div>
              </div>

              {/* Additional Fields */}
              {(viewDetailEvent.purpose || viewDetailEvent.targetParticipants || viewDetailEvent.speakers || viewDetailEvent.facilities?.length || viewDetailEvent.requirements?.length) && (
                <div className="space-y-1 pt-2 border-t border-[#E4DCCF]">
                  <label className="font-bold text-[#29374A]">Informasi Tambahan</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {viewDetailEvent.purpose && (
                      <div className="space-y-1">
                        <label className="font-bold text-[#29374A]">Tujuan Event</label>
                        <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.purpose}</p>
                      </div>
                    )}
                    {viewDetailEvent.targetParticipants && (
                      <div className="space-y-1">
                        <label className="font-bold text-[#29374A]">Target Peserta</label>
                        <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.targetParticipants}</p>
                      </div>
                    )}
                    {viewDetailEvent.speakers && (
                      <div className="space-y-1">
                        <label className="font-bold text-[#29374A]">Pembicara/Narasumber</label>
                        <p className="text-[#6F7580] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">{viewDetailEvent.speakers}</p>
                      </div>
                    )}
                    {viewDetailEvent.facilities?.length && (
                      <div className="space-y-1">
                        <label className="font-bold text-[#29374A]">Fasilitas</label>
                        <div className="bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">
                          <ul className="list-disc list-inside space-y-1 text-[#6F7580]">
                            {viewDetailEvent.facilities.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {viewDetailEvent.requirements?.length && (
                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-bold text-[#29374A]">Persyaratan</label>
                        <div className="bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">
                          <ol className="list-decimal list-inside space-y-1 text-[#6F7580]">
                            {viewDetailEvent.requirements.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection Reason (if applicable) */}
              {(viewDetailEvent.status === "rejected" || viewDetailEvent.status === "needs_revision") && viewDetailEvent.rejectionReason && (
                <div className="space-y-1 pt-2 border-t border-[#E4DCCF] bg-red-50 rounded-md p-4 border border-red-200">
                  <label className="font-bold text-red-800">Catatan Admin (Alasan Penolakan/Perbaikan)</label>
                  <p className="text-red-700 bg-white p-3 rounded border border-red-200 whitespace-pre-wrap">
                    {viewDetailEvent.rejectionReason}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-1 pt-2 border-t border-[#E4DCCF]">
                <label className="font-bold text-[#29374A]">Metadata</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#92959C] bg-[#F7F4EE] p-3 rounded-md border border-[#E4DCCF]">
                  <div>
                    <span className="font-medium">Dibuat oleh:</span> {viewDetailEvent.createdBy || "-"}
                  </div>
                  <div>
                    <span className="font-medium">Terakhir diperbarui:</span> {viewDetailEvent.updatedAt || "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#ECE5DA]">
              {viewDetailEvent && !["needs_revision", "rejected", "completed", "cancelled"].includes(viewDetailEvent.status || "") && (
                <button
                  type="button"
                  onClick={() => setRevisionNote({ event: viewDetailEvent, note: "" })}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-xs font-bold hover:bg-orange-700 transition cursor-pointer"
                >
                  Catatan Perbaikan
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewDetailEvent(null)}
                className="px-4 py-2 bg-[#315E9E] text-white rounded-md text-xs font-bold hover:bg-[#244777] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Catatan Perbaikan */}
      {revisionNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4DCCF] pb-3 mb-4">
              <h3 className="text-base font-bold text-[#29374A]">
                Catatan Perbaikan untuk Event #{revisionNote.event.id}
              </h3>
              <button
                type="button"
                onClick={() => setRevisionNote(null)}
                className="text-[#92959C] hover:text-[#6F7580] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-[#6F7580]">
                Event ini akan diubah statusnya menjadi <strong className="text-orange-700">"Perlu Perbaikan"</strong>.
                Pengguna yang mengajukan event akan melihat catatan ini saat mengedit kembali pengajuannya.
              </p>
              <div className="space-y-1.5">
                <label className="font-bold text-[#29374A] block">Catatan Perbaikan *</label>
                <textarea
                  value={revisionNote.note}
                  onChange={(e) => setRevisionNote({ ...revisionNote, note: e.target.value })}
                  rows={5}
                  placeholder="Jelaskan bagian-bagian yang perlu diperbaiki atau ditambahkan pada pengajuan event ini..."
                  className="w-full px-3 py-2 bg-[#F7F4EE] border border-[#E4DCCF] rounded-md focus:bg-[#FFFCF6] focus:outline-none focus:border-[#315E9E] resize-y"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#ECE5DA]">
              <button
                type="button"
                onClick={() => setRevisionNote(null)}
                className="px-4 py-2 border border-[#E4DCCF] text-[#29374A] rounded-md text-xs font-semibold hover:bg-[#F7F4EE] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitRevisionNote}
                className="px-4 py-2 bg-orange-600 text-white rounded-md text-xs font-bold hover:bg-orange-700 cursor-pointer"
              >
                Kirim Catatan & Ubah Status
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
