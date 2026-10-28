"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import EventCard from "@/components/EventCard";
import { apiGetEvents } from "@/lib/api";
import { Event } from "@/types";

function EventListContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "Semua";
  const initialSearch = searchParams.get("search") || "";

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<"semua" | "gratis" | "berbayar">("semua");
  const [selectedLocation, setSelectedLocation] = useState<string>("semua");
  const [sortBy, setSortBy] = useState<"terbaru" | "populer" | "harga-rendah">("terbaru");
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);

  // Data States
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const categories = [
    "Semua",
    "Seminar",
    "Workshop",
    "Lomba",
    "Beasiswa",
    "Konser & Musik",
    "Olahraga",
  ];

  useEffect(() => {
    let isMounted = true;

    apiGetEvents({
      category: selectedCategory,
      price: selectedPriceFilter,
      location: selectedLocation,
      sortBy: sortBy,
      search: searchTerm,
    })
      .then((data) => {
        if (isMounted) {
          setEvents(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Gagal memuat event:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat event dari database."
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedPriceFilter, selectedLocation, sortBy, searchTerm, refreshKey]);

  const handleResetFilters = () => {
    setSelectedCategory("Semua");
    setSelectedPriceFilter("semua");
    setSelectedLocation("semua");
    setSortBy("terbaru");
    setSearchTerm("");
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-10 flex flex-col gap-8">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Eksplorasi Daftar Event
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Temukan dan ikuti kegiatan mahasiswa terbaik dari seluruh kampus Indonesia
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-80 flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-700 focus-within:border-gray-900 transition shadow-xs">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari event, kampus..."
            className="w-full bg-transparent outline-none text-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshKey((k) => k + 1);
            }}
            className="text-xs font-bold underline hover:text-red-900 cursor-pointer ml-4"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main 2-Column Layout - Matching daftar-event.html */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Filter Sidebar (Width 280px in Figma) */}
        <aside className="w-full lg:w-72 bg-white border border-gray-300 rounded-lg p-5 flex flex-col gap-5 shrink-0 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 className="text-sm font-bold text-gray-900">Filter Event</h2>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              Reset All
            </button>
          </div>

          {/* Kategori Filter */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-gray-900 tracking-wider">KATEGORI</span>
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory.toLowerCase() === cat.toLowerCase()}
                    onChange={() => setSelectedCategory(cat)}
                    className="accent-gray-900 w-3.5 h-3.5"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Biaya Filter */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-gray-900 tracking-wider">BIAYA</span>
            <div className="flex flex-col gap-2">
              {[
                { label: "Semua Biaya", value: "semua" },
                { label: "Gratis (Free)", value: "gratis" },
                { label: "Berbayar", value: "berbayar" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900"
                >
                  <input
                    type="radio"
                    name="priceFilter"
                    checked={selectedPriceFilter === opt.value}
                    onChange={() => setSelectedPriceFilter(opt.value as "semua" | "gratis" | "berbayar")}
                    className="accent-gray-900 w-3.5 h-3.5"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Lokasi Filter */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-gray-900 tracking-wider">LOKASI EVENT</span>
            <div className="flex flex-col gap-2">
              {[
                { label: "Semua Lokasi", value: "semua" },
                { label: "Online / Daring (Zoom/Figma)", value: "online" },
                { label: "Offline (Kampus / GOR)", value: "offline" },
              ].map((loc) => (
                <label
                  key={loc.value}
                  className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-gray-900"
                >
                  <input
                    type="radio"
                    name="locationFilter"
                    checked={selectedLocation === loc.value}
                    onChange={() => setSelectedLocation(loc.value)}
                    className="accent-gray-900 w-3.5 h-3.5"
                  />
                  <span>{loc.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Main Grid Area */}
        <section className="flex-1 flex flex-col gap-6 w-full">
          {/* Top Sort & Count Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-300 rounded-lg p-4 shadow-xs">
            <div className="text-xs sm:text-sm text-gray-600">
              Menampilkan <strong className="text-gray-900">{events.length}</strong> event kampus yang ditemukan
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Urutkan:</span>
              <select
                aria-label="Urutkan Event"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "terbaru" | "populer" | "harga-rendah")}
                className="text-xs font-semibold bg-gray-50 border border-gray-300 rounded-md px-3 py-1.5 text-gray-800 outline-none cursor-pointer focus:border-gray-900"
              >
                <option value="terbaru">Terbaru Ditambahkan</option>
                <option value="populer">Paling Populer</option>
                <option value="harga-rendah">Biaya Terendah (Gratis)</option>
              </select>
            </div>
          </div>

          {/* Active Filter Tags */}
          {(selectedCategory !== "Semua" || selectedPriceFilter !== "semua" || searchTerm) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">Filter Aktif:</span>
              {selectedCategory !== "Semua" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-900 text-white text-xs font-medium">
                  {selectedCategory}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("Semua")}
                    className="hover:text-gray-300 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedPriceFilter !== "semua" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-100 text-gray-800 border border-gray-300 text-xs font-medium">
                  Biaya: {selectedPriceFilter}
                  <button
                    type="button"
                    onClick={() => setSelectedPriceFilter("semua")}
                    className="hover:text-gray-500 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-100 text-gray-800 border border-gray-300 text-xs font-medium">
                  Keyword: &quot;{searchTerm}&quot;
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="hover:text-gray-500 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-blue-600 hover:underline ml-2 cursor-pointer"
              >
                Hapus Semua
              </button>
            </div>
          )}

          {/* Events Grid / Loading / Empty */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white border border-gray-200 rounded-lg h-72 animate-pulse p-4 flex flex-col justify-between">
                  <div className="bg-gray-200 h-40 rounded-md w-full" />
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">🔍</span>
              <h3 className="text-base font-bold text-gray-900">Event Tidak Ditemukan</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Tidak ada event yang cocok dengan kriteria filter saat ini. Coba gunakan kata kunci lain atau reset filter.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-md hover:bg-gray-800 transition cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              type="button"
              className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-md text-gray-400 cursor-not-allowed"
              disabled
            >
              Sebelumnya
            </button>
            <span className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-md">
              1
            </span>
            <button
              type="button"
              className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              2
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              3
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Berikutnya
            </button>
          </div>
        </section>
      </div>
    </div>
  );
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
      <EventListContent />
    </Suspense>
  );
}
