"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGetEvents, apiCreateEvent, apiUpdateEvent, apiDeleteEvent } from "@/lib/api";
import { adminStats } from "@/lib/mock-data";
import { Event } from "@/types";

export default function AdminDashboardPage() {
  const [eventList, setEventList] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form states for new event
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Seminar");
  const [newDate, setNewDate] = useState("2026-11-12");
  const [newLocation, setNewLocation] = useState("Auditorium Kampus");
  const [newPrice, setNewPrice] = useState("0");
  const [newOrganizer, setNewOrganizer] = useState("BEM Universitas");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    apiGetEvents()
      .then((data) => {
        if (isMounted) {
          setEventList(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Gagal memuat event admin:", err);
          setError("Gagal mengambil data event dari database.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

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
      (selectedStatus === "Tutup" && isClosed);

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

  // Action: Add New Event (API)
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await apiCreateEvent({
        title: newTitle,
        description: `Deskripsi kegiatan ${newTitle} yang diselenggarakan oleh ${newOrganizer} di ${newLocation}.`,
        date: newDate,
        time: "09:00 - 13:00 WIB",
        location: newLocation,
        category: newCategory,
        image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
        price: Number(newPrice) || 0,
        organizer: newOrganizer,
        quota: 100,
        registeredCount: 0,
        status: "active",
        isPopular: false,
      });

      setEventList([created, ...eventList]);
      setIsAddModalOpen(false);
      setNewTitle("");
      alert(`Event "${newTitle}" berhasil dibuat dan disimpan ke database!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan event baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Toggle Event Status (API)
  const handleToggleStatus = async (id: string) => {
    const target = eventList.find((e) => e.id === id);
    if (!target) return;

    const nextStatus = target.status === "completed" ? "active" : "completed";
    try {
      const updated = await apiUpdateEvent(id, { status: nextStatus });
      setEventList((prev) =>
        prev.map((e) => (e.id === id ? updated : e))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui status event.");
    }
  };

  // Action: Save Edited Event (API)
  const handleSaveEdit = async () => {
    if (!editingEvent) return;

    try {
      const updated = await apiUpdateEvent(editingEvent.id, {
        title: editingEvent.title,
        location: editingEvent.location,
        status: editingEvent.status,
      });

      setEventList((prev) =>
        prev.map((e) => (e.id === editingEvent.id ? updated : e))
      );
      setEditingEvent(null);
      alert("Perubahan data event berhasil disimpan ke database!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan perubahan event.");
    }
  };

  const totalRegistrations = eventList.reduce(
    (sum, evt) => sum + (evt.registeredCount || 0),
    0
  );

  return (
    <main className="flex-1 p-6 md:p-12 flex flex-col gap-8 bg-gray-50">
      {/* Top Header - Matching dashboard-admin.html */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Dashboard Ringkasan
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Overview data platform EventHub Kampus hari ini (Database Real).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-gray-900 text-white font-semibold text-xs sm:text-sm rounded-md hover:bg-gray-800 transition cursor-pointer self-start sm:self-auto shadow-xs flex items-center gap-2"
        >
          <span>+ Tambah Event Baru</span>
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
        <div className="p-5 bg-white border border-gray-300 rounded-lg shadow-xs flex flex-col gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Event
          </span>
          <div className="text-3xl font-extrabold text-gray-900">
            {isLoading ? "..." : eventList.length}
          </div>
          <span className="text-[11px] text-gray-500 font-medium">Terdaftar di PostgreSQL</span>
        </div>

        <div className="p-5 bg-white border border-gray-300 rounded-lg shadow-xs flex flex-col gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Event Aktif
          </span>
          <div className="text-3xl font-extrabold text-gray-900">
            {isLoading ? "..." : eventList.filter((e) => e.status !== "completed" && e.status !== "cancelled").length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Pendaftaran terbuka</span>
        </div>

        <div className="p-5 bg-white border border-gray-300 rounded-lg shadow-xs flex flex-col gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Pendaftar
          </span>
          <div className="text-3xl font-extrabold text-gray-900">
            {isLoading ? "..." : totalRegistrations.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-gray-500 font-medium">Tiket terakumulasi</span>
        </div>

        <div className="p-5 bg-white border border-gray-300 rounded-lg shadow-xs flex flex-col gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Pengguna
          </span>
          <div className="text-3xl font-extrabold text-gray-900">
            {adminStats.totalUsers.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Mahasiswa & organizer</span>
        </div>
      </div>

      {/* Main Table Card - Matching dashboard-admin.html */}
      <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
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
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:border-gray-900 w-44 sm:w-56 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              aria-label="Filter Kategori"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-md text-gray-700 outline-none cursor-pointer focus:border-gray-900"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Seminar">Seminar</option>
              <option value="Workshop">Workshop</option>
              <option value="Lomba">Lomba</option>
              <option value="Beasiswa">Beasiswa</option>
              <option value="Konser & Musik">Konser & Musik</option>
              <option value="Olahraga">Olahraga</option>
            </select>

            <select
              aria-label="Filter Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-md text-gray-700 outline-none cursor-pointer focus:border-gray-900"
            >
              <option value="Semua">Semua Status</option>
              <option value="Buka">Buka (Aktif)</option>
              <option value="Tutup">Tutup (Selesai)</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-400 animate-pulse">
              Memuat data event dashboard...
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Nama Event</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Tanggal Pelaksanaan</th>
                  <th className="py-3 px-4">Penyelenggara</th>
                  <th className="py-3 px-4 text-center">Pendaftar</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((evt) => {
                    const isClosed = evt.status === "completed" || evt.status === "cancelled";
                    return (
                      <tr key={evt.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3 px-4 font-semibold text-gray-900 max-w-xs truncate">
                          <Link href={`/event/${evt.id}`} className="hover:underline">
                            {evt.title}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                            {evt.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                          {evt.date}
                        </td>
                        <td className="py-3 px-4 text-gray-600 truncate max-w-[150px]">
                          {evt.organizer}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-800">
                          {evt.registeredCount || 0} / {evt.quota || 100}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(evt.id)}
                            title="Klik untuk mengubah status"
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                              isClosed
                                ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {isClosed ? "Tutup" : "Buka"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingEvent(evt)}
                              className="px-2 py-1 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition cursor-pointer"
                            >
                              Edit
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
                    <td colSpan={7} className="py-8 text-center text-gray-500 text-xs">
                      Tidak ada data event yang sesuai dengan filter atau kata kunci pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Tambah Event Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-gray-300 rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Tambah Event Baru Kampus
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="flex flex-col gap-3 text-xs sm:text-sm">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">Judul Event</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Seminar Nasional AI 2026"
                  required
                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:border-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md cursor-pointer focus:bg-white focus:outline-none focus:border-gray-900"
                  >
                    <option value="Seminar">Seminar</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Lomba">Lomba</option>
                    <option value="Beasiswa">Beasiswa</option>
                    <option value="Konser & Musik">Konser & Musik</option>
                    <option value="Olahraga">Olahraga</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700">Penyelenggara</label>
                  <input
                    type="text"
                    value={newOrganizer}
                    onChange={(e) => setNewOrganizer(e.target.value)}
                    placeholder="BEM / Himpunan"
                    required
                    className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:border-gray-900"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700">Biaya (0 = Gratis)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">Lokasi Kegiatan</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Auditorium / Gedung B / Zoom"
                  required
                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gray-900 text-white rounded-md text-xs font-bold hover:bg-gray-800 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Event */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-gray-300 rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Edit Event #{editingEvent.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs sm:text-sm">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">Judul Event</label>
                <input
                  type="text"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">Lokasi</label>
                <input
                  type="text"
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">Status Pendaftaran</label>
                <select
                  value={editingEvent.status || "active"}
                  onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as Event["status"] })}
                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md cursor-pointer"
                >
                  <option value="active">Buka (Aktif)</option>
                  <option value="completed">Tutup (Selesai)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-gray-900 text-white rounded-md text-xs font-bold hover:bg-gray-800 cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
