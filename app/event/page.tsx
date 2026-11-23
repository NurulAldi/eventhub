"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import EventCard from "@/components/EventCard";
import { apiGetEvents } from "@/lib/api";
import { Event } from "@/types";
import { getEventLifecycleStatus } from "@/lib/event-lifecycle";

function FilterCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-blue-600 rounded"
      />
      <span>{label}</span>
    </label>
  );
}

const RELATED_KEYWORDS = [
  "teknologi informasi",
  "kecerdasan buatan",
  "transformasi digital",
  "data science",
  "startup",
  "inovasi teknologi",
];

function EventListContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "Semua";
  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sortBy") || "terbaru";
  const initialStatus = searchParams.get("status") || "";

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory === "Semua" ? [] : [initialCategory]
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(
    initialStatus ? [initialStatus] : []
  );
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<"semua" | "gratis" | "berbayar">("semua");
  const [sortBy, setSortBy] = useState<"terbaru" | "populer" | "deadline-terdekat" | "harga-rendah">(
    initialSort as "terbaru" | "populer" | "deadline-terdekat" | "harga-rendah"
  );
  const [pendingSearch, setPendingSearch] = useState<string>(initialSearch);

  // Top search bar state (untuk mode pencarian Gambar 4)
  const [searchBarInput, setSearchBarInput] = useState<string>(initialSearch);
  const [isSearchModeActive, setIsSearchModeActive] = useState<boolean>(Boolean(initialSearch.trim()));

  // Applied filter states
  const [appliedCategories, setAppliedCategories] = useState<string[]>(
    initialCategory === "Semua" ? [] : [initialCategory]
  );
  const [appliedTypes, setAppliedTypes] = useState<string[]>([]);
  const [appliedStatus, setAppliedStatus] = useState<string[]>(
    initialStatus ? [initialStatus] : []
  );
  const [appliedPriceFilter, setAppliedPriceFilter] = useState<"semua" | "gratis" | "berbayar">("semua");
  const [appliedSearch, setAppliedSearch] = useState<string>(initialSearch);

  // Data states
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 8;

  const categories = ["Semua Kategori", "Lomba", "Seminar", "Beasiswa", "Workshop", "Organisasi", "Technopreneurship", "Kegiatan Kampus"];
  const eventTypes = ["Semua Jenis", "Online", "Offline", "Hybrid"];
  const eventStatuses = ["Semua Status", "Terverifikasi", "Berlangsung"];

  useEffect(() => {
    let isMounted = true;
    apiGetEvents({
      category: "Semua",
      price: appliedPriceFilter,
      sortBy: sortBy,
      search: appliedSearch,
    })
      .then((data) => {
        if (isMounted) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          let openEvents = sortBy === "deadline-terdekat"
            ? data
                .filter((event) => !["completed", "cancelled"].includes(event.status || ""))
                .filter((event) => {
                  if (!event.registrationDeadline) return true;
                  const deadline = new Date(`${event.registrationDeadline}T23:59:59`);
                  return deadline >= today;
                })
            : [...data];

          if (appliedCategories.length > 0) {
            openEvents = openEvents.filter((event) =>
              appliedCategories.some((category) => event.category === category)
            );
          }

          if (appliedTypes.length > 0) {
            openEvents = openEvents.filter((event) =>
              appliedTypes.some((type) => event.eventMode?.toLowerCase() === type.toLowerCase())
            );
          }

          if (appliedStatus.includes("Terverifikasi")) {
            openEvents = openEvents.filter((event) =>
              ["active", "published"].includes(event.status || "")
            );
          }

          if (appliedStatus.includes("Berlangsung")) {
            openEvents = openEvents.filter((event) => {
              const lifecycle = getEventLifecycleStatus(event);
              return lifecycle.stage === "ongoing";
            });
          }

          if (sortBy === "deadline-terdekat") {
            openEvents.sort((a, b) => {
              if (!a.registrationDeadline && !b.registrationDeadline) return 0;
              if (!a.registrationDeadline) return 1;
              if (!b.registrationDeadline) return -1;
              return new Date(a.registrationDeadline).getTime() - new Date(b.registrationDeadline).getTime();
            });
          }

          setEvents(openEvents);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Gagal memuat event:", err);
          setError(err instanceof Error ? err.message : "Gagal memuat event dari database.");
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [appliedCategories, appliedTypes, appliedStatus, appliedPriceFilter, sortBy, appliedSearch, refreshKey]);

  const handleKeywordSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    setIsLoading(true);
    setAppliedSearch(pendingSearch.trim());
  };

  const handleClearSearch = () => {
    setPendingSearch("");
    setIsLoading(true);
    setAppliedSearch("");
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setCurrentPage(1);
    setIsLoading(true);
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSelectedStatus([]);
    setAppliedTypes([]);
    setAppliedStatus([]);
    setSelectedPriceFilter("semua");
    setPendingSearch("");
    setSearchBarInput("");
    setAppliedCategories([]);
    setAppliedPriceFilter("semua");
    setAppliedSearch("");
    setIsSearchModeActive(false);
  };

  const handleTopSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setIsLoading(true);
    setAppliedSearch(searchBarInput);
    setPendingSearch(searchBarInput);
  };

  const handleKeywordClick = (kw: string) => {
    setCurrentPage(1);
    setIsLoading(true);
    setSearchBarInput(kw);
    setAppliedSearch(kw);
    setPendingSearch(kw);
  };

  const toggleCategory = (cat: string) => {
    if (cat === "Semua Kategori") {
      setSelectedCategories([]);
      setAppliedCategories([]);
      setCurrentPage(1);
      setIsLoading(true);
      return;
    }

    const nextCategories = selectedCategories.includes(cat)
      ? selectedCategories.filter((category) => category !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(nextCategories);
    setAppliedCategories(nextCategories);
    setCurrentPage(1);
    setIsLoading(true);
  };

  const isCategoryChecked = (cat: string) => {
    if (cat === "Semua Kategori") return selectedCategories.length === 0;
    return selectedCategories.includes(cat);
  };

  const totalPages = Math.ceil(events.length / eventsPerPage);
  const visibleEvents = events.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage);

  const isSearchMode = isSearchModeActive && Boolean(appliedSearch.trim());
  const hasActiveFilters = appliedCategories.length > 0 || appliedTypes.length > 0 || appliedStatus.length > 0 || appliedPriceFilter !== "semua" || Boolean(appliedSearch.trim());

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => { setIsLoading(true); setRefreshKey((k) => k + 1); }}
              className="text-xs font-bold underline hover:text-red-900 cursor-pointer ml-4"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* KONDISI 1: SEARCH MODE (Sesuai Gambar 4 - Hasil Pencarian)    */}
        {/* ============================================================== */}
        {isSearchMode ? (
          <div className="flex flex-col gap-6">
            
            {/* Search Input Bar Besar di Atas */}
            <form onSubmit={handleTopSearchSubmit} className="flex items-center gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex-1 flex items-center gap-3 px-3">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchBarInput}
                  onChange={(e) => setSearchBarInput(e.target.value)}
                  placeholder="Ketik topik event, seminar teknologi, lomba..."
                  className="w-full text-sm sm:text-base text-gray-900 outline-none bg-transparent placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-700 text-white font-semibold text-sm rounded-xl hover:bg-blue-800 active:scale-95 transition shadow-sm cursor-pointer"
              >
                Cari
              </button>
            </form>

            {/* Hasil Pencarian Title & Sorting Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Hasil pencarian untuk <span className="text-blue-700">&quot;{appliedSearch}&quot;</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Ditemukan {events.length} event
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500">Urutkan:</span>
                <select
                  aria-label="Urutkan Hasil Pencarian"
                  value={sortBy}
                  onChange={(e) => {
                    setIsLoading(true);
                    setSortBy(e.target.value as "terbaru" | "populer" | "deadline-terdekat" | "harga-rendah");
                  }}
                  className="text-xs font-semibold bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 outline-none cursor-pointer hover:border-blue-300"
                >
                  <option value="terbaru">Paling Relevan</option>
                  <option value="populer">Paling Populer</option>
                  <option value="deadline-terdekat">Deadline Terdekat</option>
                  <option value="harga-rendah">Biaya Terendah</option>
                </select>
              </div>
            </div>

            {/* Kata Kunci Terkait Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-gray-500 font-medium whitespace-nowrap flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Kata kunci terkait:
              </span>
              {RELATED_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleKeywordClick(kw)}
                  className={`px-3 py-1 rounded-full border transition whitespace-nowrap cursor-pointer ${
                    appliedSearch.toLowerCase() === kw.toLowerCase()
                      ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-700"
                  }`}
                >
                  {kw}
                </button>
              ))}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-blue-600 hover:underline font-semibold ml-2 whitespace-nowrap cursor-pointer"
              >
                Hapus Pencarian
              </button>
            </div>

            {/* Layout 2 Kolom: Kiri List Event Horizontal, Kanan Box Promo / Ajukan Event */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">
              
              {/* Kolom Kiri: Event Cards dalam format Horizontal List */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, n) => (
                    <div key={n} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-4 animate-pulse">
                      <div className="w-32 h-28 bg-gray-200 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                        <div className="h-5 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : events.length > 0 ? (
                  events.map((evt) => {
                    const formattedDate = new Date(evt.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });
                    const lifecycle = getEventLifecycleStatus(evt);
                    const deadlineFormatted = evt.registrationDeadline
                      ? new Date(`${evt.registrationDeadline}T00:00:00`).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : null;
                    const executionStatus = lifecycle.label;

                    return (
                      <div
                        key={evt.id}
                        className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                      >
                        <div className="flex items-start sm:items-center gap-4 min-w-0">
                          {/* Poster Thumbnail */}
                          <div className="relative w-28 h-24 sm:w-36 sm:h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            <Image
                              src={evt.image}
                              alt={evt.title}
                              fill
                              sizes="150px"
                              className="object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {executionStatus ? (
                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${lifecycle.badgeClass}`}>
                                  {executionStatus}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  ✓ Terverifikasi
                                </span>
                              )}
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                {evt.category}
                              </span>
                            </div>

                            <Link href={`/event/${evt.id}`}>
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-700 transition line-clamp-2 leading-snug">
                                {evt.title}
                              </h3>
                            </Link>

                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <span>🏛️</span>
                              <span className="truncate">{evt.organizer}</span>
                            </p>

                            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap pt-0.5">
                              <span className="text-gray-600 font-medium">📅 {formattedDate}</span>
                              {deadlineFormatted && (
                                <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
                                  ⌛ Deadline {deadlineFormatted}
                                </span>
                              )}
                              <span className="truncate max-w-[200px]">📍 {evt.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Button Lihat Detail */}
                        <Link
                          href={`/event/${evt.id}`}
                          className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 text-white text-xs font-semibold rounded-xl hover:bg-blue-800 transition text-center shrink-0 cursor-pointer shadow-sm"
                        >
                          Lihat Detail
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center flex flex-col items-center gap-3">
                    <span className="text-4xl">🔍</span>
                    <h3 className="text-base font-bold text-gray-900">Tidak ada event ditemukan</h3>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Tidak ada event yang cocok dengan pencarian &quot;{appliedSearch}&quot;. Coba gunakan kata kunci umum lain.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-2 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition"
                    >
                      Lihat Semua Event
                    </button>
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Card "Tidak menemukan event yang dicari?" - Sesuai Gambar 4 */}
              <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                
                {/* Ilustrasi maskot orang berpikir */}
                <div className="relative w-full h-36 bg-blue-50/60 rounded-xl overflow-hidden flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shadow-md">
                        🤔
                      </div>
                      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold flex items-center justify-center border-2 border-white">
                        ?
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Tidak menemukan event yang dicari?
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
                    Ajukan event di EventHub Kampus dan bantu teman-teman mahasiswa menemukan kegiatan bermanfaat lainnya.
                  </p>
                </div>

                <Link
                  href="/pengajuan-event"
                  className="w-full py-3 bg-blue-700 text-white font-bold text-sm rounded-xl hover:bg-blue-800 transition flex items-center justify-center gap-2 shadow-sm text-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Ajukan Event
                </Link>

                <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-gray-900">Manfaat mengajukan event:</span>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>Event Anda akan ditinjau oleh tim kami</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>Menjangkau lebih banyak mahasiswa</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>Berkontribusi pada ekosistem kampus yang lebih aktif</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* ============================================================== */
          /* KONDISI 2: JELAJAHI SEMUA EVENT (Sesuai Gambar 5)               */
          /* ============================================================== */
          <div className="flex flex-col gap-8">
            
            {/* Header + Banner Promo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <nav className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <Link href="/" className="hover:text-gray-600">Beranda</Link>
                  <span>&gt;</span>
                  <span className="text-gray-600 font-medium">Jelajahi Event</span>
                </nav>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Jelajahi Semua Event</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Temukan lomba, seminar, beasiswa, dan kegiatan mahasiswa dari berbagai kampus dan organisasi.
                </p>
              </div>

              {/* Promo Banner Kanan Atas */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3 overflow-hidden relative shadow-xs">
                <div>
                  <p className="text-sm font-bold text-blue-900 leading-tight">
                    Lebih Banyak Pengalaman,<br/>Lebih Cerah Masa Depanmu
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Setiap Event Adalah Kesempatan Baru</p>
                </div>
                <div className="w-16 h-16 opacity-30 shrink-0">
                  <svg viewBox="0 0 100 100" fill="currentColor" className="text-blue-600">
                    <rect x="25" y="35" width="50" height="55" rx="3"/>
                    <rect x="35" y="15" width="30" height="22" rx="2"/>
                    <rect x="43" y="5" width="14" height="12"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Main 2-Column Layout: Sidebar Filter Kiri + Grid Card Kanan */}
            <div className="flex flex-col lg:flex-row items-start gap-6">
              
              {/* Sidebar Filter Kiri */}
              <aside className="w-full lg:w-60 xl:w-64 bg-white border border-gray-200 rounded-2xl shadow-sm shrink-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                    <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter Event
                  </div>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="p-5 flex flex-col gap-5">
                  {/* Kategori Event */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Kategori Event</span>
                    <div className="flex flex-col gap-2">
                      {categories.map((cat) => (
                        <FilterCheckbox
                          key={cat}
                          checked={isCategoryChecked(cat)}
                          onChange={() => toggleCategory(cat)}
                          label={cat}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-gray-100" />

                  {/* Jenis Event */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Jenis Event</span>
                    <div className="flex flex-col gap-2">
                      {eventTypes.map((type) => (
                        <FilterCheckbox
                          key={type}
                          checked={type === "Semua Jenis" ? selectedTypes.length === 0 : selectedTypes.includes(type)}
                          onChange={() => {
                            let nextTypes: string[];
                            if (type === "Semua Jenis") {
                              nextTypes = [];
                            } else {
                              nextTypes = selectedTypes.includes(type)
                                ? selectedTypes.filter((item) => item !== type)
                                : [...selectedTypes, type];
                            }
                            setSelectedTypes(nextTypes);
                            setAppliedTypes(nextTypes);
                            setCurrentPage(1);
                            setIsLoading(true);
                          }}
                          label={type}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-gray-100" />

                  {/* Status Event */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Status Event</span>
                    <div className="flex flex-col gap-2">
                      {eventStatuses.map((status) => (
                        <label key={status} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="statusFilter"
                            checked={status === "Semua Status" ? selectedStatus.length === 0 : selectedStatus.includes(status)}
                            onChange={() => {
                              const nextStatus = status === "Semua Status" ? [] : [status];
                              setSelectedStatus(nextStatus);
                              setAppliedStatus(nextStatus);
                              setCurrentPage(1);
                              setIsLoading(true);
                            }}
                            className="w-4 h-4 accent-blue-600"
                          />
                          <span>{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-gray-100" />

                  {/* Biaya */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Biaya</span>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: "Semua Biaya", value: "semua" },
                        { label: "Gratis", value: "gratis" },
                        { label: "Berbayar", value: "berbayar" },
                      ].map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="priceFilter"
                            checked={selectedPriceFilter === opt.value}
                            onChange={() => {
                              const nextPrice = opt.value as "semua" | "gratis" | "berbayar";
                              setSelectedPriceFilter(nextPrice);
                              setAppliedPriceFilter(nextPrice);
                              setCurrentPage(1);
                              setIsLoading(true);
                            }}
                            className="w-4 h-4 accent-blue-600"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Sisi Kanan: Top Bar Urutkan + Grid 4 Kolom Event */}
              <section className="flex-1 flex flex-col gap-5 w-full min-w-0">
                
                {/* Card Pencarian Kata Kunci (Kiri) & Urutkan (Kanan) */}
                <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  {/* Field pencarian kata kunci di bagian kiri card */}
                  <form onSubmit={handleKeywordSearch} className="flex-1 flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={pendingSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPendingSearch(val);
                        if (!val.trim() && appliedSearch) {
                          setAppliedSearch("");
                          setCurrentPage(1);
                        }
                      }}
                      placeholder="Cari kata kunci event, seminar, lomba..."
                      className="w-full bg-transparent text-xs sm:text-sm text-gray-900 outline-none placeholder-gray-400"
                    />
                    {pendingSearch && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer p-0.5"
                        aria-label="Hapus kata kunci"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 active:scale-95 transition shrink-0 cursor-pointer shadow-xs"
                    >
                      Cari
                    </button>
                  </form>

                  {/* Urutkan ... tepat di sebelah kanan field pencarian */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500 whitespace-nowrap">Urutkan:</span>
                    <select
                      aria-label="Urutkan Event"
                      value={sortBy}
                      onChange={(e) => {
                        setIsLoading(true);
                        setSortBy(e.target.value as "terbaru" | "populer" | "deadline-terdekat" | "harga-rendah");
                        setCurrentPage(1);
                      }}
                      className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none cursor-pointer hover:border-blue-300 transition"
                    >
                      <option value="terbaru">Terbaru</option>
                      <option value="populer">Paling Populer</option>
                      <option value="deadline-terdekat">Deadline Terdekat</option>
                      <option value="harga-rendah">Biaya Terendah</option>
                    </select>
                  </div>
                </div>

                {/* Menampilkan ... dari ... event (dikeluarkan dari card, tepat di bawah card & di atas card-card event) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-sm text-gray-600">
                  <div>
                    Menampilkan{" "}
                    <strong className="text-gray-900">
                      {events.length > 0 ? (currentPage - 1) * eventsPerPage + 1 : 0}–{Math.min(currentPage * eventsPerPage, events.length)}
                    </strong>
                    {" "}dari{" "}
                    <strong className="text-gray-900">{events.length}</strong> event
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="ml-2 text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        Hapus filter
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Filter Tags */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 px-1">
                    <span className="text-xs text-gray-500">Filter aktif:</span>
                    {appliedCategories.map((cat) => (
                      <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-700 text-white text-xs font-medium">
                        {cat}
                        <button type="button" onClick={() => { setAppliedCategories([]); setSelectedCategories([]); }} className="hover:text-blue-200 cursor-pointer">✕</button>
                      </span>
                    ))}
                    {appliedPriceFilter !== "semua" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium">
                        Biaya: {appliedPriceFilter}
                        <button type="button" onClick={() => { setAppliedPriceFilter("semua"); setSelectedPriceFilter("semua"); }} className="hover:text-gray-500 cursor-pointer">✕</button>
                      </span>
                    )}
                    {appliedStatus.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                        Status: {appliedStatus[0]}
                        <button type="button" onClick={() => { setAppliedStatus([]); setSelectedStatus([]); }} className="hover:text-emerald-900 cursor-pointer">✕</button>
                      </span>
                    )}
                    {appliedSearch && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                        Kata kunci: &quot;{appliedSearch}&quot;
                        <button type="button" onClick={handleClearSearch} className="hover:text-blue-900 cursor-pointer">✕</button>
                      </span>
                    )}
                  </div>
                )}

                {/* Grid 4 Kolom Sesuai Gambar 5 */}
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, n) => (
                      <div key={n} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                        <div className="bg-gray-200 h-36 w-full" />
                        <div className="p-3.5 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-1/4" />
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : events.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {visibleEvents.map((evt) => (
                      <EventCard key={evt.id} event={evt} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                    <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
                      <path strokeLinecap="round" strokeWidth="1.5" d="m20 20-4-4" />
                    </svg>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Event Tidak Ditemukan</h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-sm">
                        Tidak ada event yang cocok dengan kriteria filter. Coba ubah filter atau gunakan kata kunci lain.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 transition cursor-pointer"
                    >
                      Reset Semua Filter
                    </button>
                  </div>
                )}

                {/* Pagination Numerik */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500 order-2 sm:order-1">
                      Menampilkan {(currentPage - 1) * eventsPerPage + 1}–{Math.min(currentPage * eventsPerPage, events.length)} dari {events.length} event
                    </span>
                    <div className="flex items-center gap-1 order-1 sm:order-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs transition ${
                          currentPage === 1
                            ? "border-gray-200 text-gray-300 cursor-not-allowed"
                            : "border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 cursor-pointer"
                        }`}
                      >
                        ‹
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer ${
                            currentPage === page
                              ? "bg-blue-700 text-white border border-blue-700 shadow-xs"
                              : "border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 bg-white"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs transition ${
                          currentPage === totalPages
                            ? "border-gray-200 text-gray-300 cursor-not-allowed"
                            : "border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 cursor-pointer"
                        }`}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}

              </section>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function EventListWithQueryKey() {
  const searchParams = useSearchParams();
  return <EventListContent key={searchParams.toString()} />;
}

export default function EventListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 max-w-7xl w-full mx-auto p-12 text-center text-sm text-gray-500">
          Memuat daftar event kampus...
        </div>
      }
    >
      <EventListWithQueryKey />
    </Suspense>
  );
}
