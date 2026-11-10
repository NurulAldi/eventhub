"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventCard from "@/components/EventCard";
import { apiGetEvents } from "@/lib/api";
import { Event } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getPopularityLabel, getRegistrationPercentage } from "@/lib/event-popularity";

function CategoryIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const paths: Record<string, string> = {
    academic: "M12 3 3 7l9 4 7-3.11V14m-7-3L5 8.67V14l7 4 7-4V8.89M19 14v4",
    workshop: "M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4L15 12l-3-3 2.7-2.7Z",
    competition: "m12 3 1.8 5.3H19l-4.2 3.1 1.6 5.2-4.4-3.2-4.4 3.2 1.6-5.2L5 8.3h5.2L12 3Z",
    scholarship: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
    music: "M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z",
    sports: "M12 4v16M4 12h16M7 7l10 10M17 7 7 17",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.academic} />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    apiGetEvents({ sortBy: "terbaru" })
      .then((data) => {
        if (isMounted) {
          setEvents(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Gagal mengambil event:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat memuat data event dari database."
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/event?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/event");
    }
  };

  const handleCreateEvent = () => {
    if (!user) {
      router.push("/login");
    } else if (user.role === "user") {
      router.push("/pengajuan-event");
    } else {
      router.push("/dashboard");
    }
  };

  // Filter events for different sections
  const recentEvents = events.slice(0, 3);
  const popularEvents = events
    .filter((event) => getPopularityLabel(event))
    .sort((a, b) => getRegistrationPercentage(b) - getRegistrationPercentage(a))
    .slice(0, 3);
  const deadlineEvents = [...events]
    .sort((a, b) => {
      const aIsClosed = a.status === "completed" || a.status === "cancelled";
      const bIsClosed = b.status === "completed" || b.status === "cancelled";
      if (aIsClosed !== bIsClosed) return aIsClosed ? 1 : -1;
      return a.date.localeCompare(b.date);
    })
    .slice(0, 3);

  // Dynamic category count helper
  const getCategoryCount = (categoryName: string) => {
    const count = events.filter(
      (e) => e.category.toLowerCase() === categoryName.toLowerCase()
    ).length;
    return `${count} Event`;
  };

  const categories = [
    { name: "Seminar", icon: "academic", count: getCategoryCount("Seminar") },
    { name: "Workshop", icon: "workshop", count: getCategoryCount("Workshop") },
    { name: "Lomba", icon: "competition", count: getCategoryCount("Lomba") },
    { name: "Beasiswa", icon: "scholarship", count: getCategoryCount("Beasiswa") },
    { name: "Konser & Musik", icon: "music", count: getCategoryCount("Konser & Musik") },
    { name: "Olahraga", icon: "sports", count: getCategoryCount("Olahraga") },
    { name: "Technopreneurship", icon: "workshop", count: getCategoryCount("Technopreneurship") },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-[#EAE2D4] via-[#F7F4EE] to-[#E5ECF5]">
      {/* Hero Section - Matching beranda.html */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#244777] via-[#315E9E] to-[#315E9E] border-b border-[#244777] py-16 sm:py-20 px-6 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(233,130,104,0.28),transparent_38%)] before:pointer-events-none">
        <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-6 text-center">
          <div className="max-w-2xl flex flex-col gap-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Temukan <span className="text-[#E98268]">Event Kampus</span> Terbaikmu
            </h1>
            <p className="text-sm sm:text-base text-[#E5ECF5] leading-relaxed max-w-xl mx-auto">
              Pusat informasi kompetisi, seminar, beasiswa, dan pengabdian masyarakat terlengkap untuk mahasiswa seluruh Indonesia.
            </p>
          </div>

          {/* Search Box - Figma Style */}
          <form
            onSubmit={handleSearch}
            className="w-full max-w-2xl p-2 bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl shadow-lg shadow-[#244777]/20 flex items-center gap-3 transition focus-within:border-[#E98268] focus-within:ring-2 focus-within:ring-[#E98268]/30"
          >
            <div className="flex-1 flex items-center gap-2.5 px-3">
              <svg className="w-5 h-5 text-[#92959C] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama event, kampus, atau penyelenggara..."
                className="w-full text-xs sm:text-sm text-[#29374A] placeholder-[#92959C] bg-transparent outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#E98268] text-white font-semibold text-xs sm:text-sm rounded-lg hover:bg-[#C9674F] active:scale-95 transition-transform shrink-0 cursor-pointer"
            >
              Cari Event
            </button>
          </form>

          {/* Quick Category Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-[#6F7580] font-medium">Kategori Populer:</span>
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.name}
                href={`/event?category=${encodeURIComponent(cat.name)}`}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  cat.name === "Seminar"
                    ? "bg-[#DBE8F8] text-[#244777] hover:bg-[#C7D9F0]"
                    : cat.name === "Lomba"
                      ? "bg-[#FBE2D8] text-[#9A4F3A] hover:bg-[#F4C9BB]"
                      : cat.name === "Beasiswa"
                        ? "bg-[#DDF2E8] text-[#246746] hover:bg-[#C8E8D8]"
                        : "bg-[#E5ECF5] text-[#244777] hover:bg-[#C7D9F0]"
                }`}
              >
                <CategoryIcon name={cat.icon} className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" /> {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Sections - Matching beranda.html */}
      <main className="max-w-7xl w-full mx-auto px-6 lg:px-16 py-14 flex flex-col gap-14">
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
                setReloadTrigger((prev) => prev + 1);
              }}
              className="text-xs font-bold underline hover:text-red-900 cursor-pointer ml-4"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Section 1: Buat Event */}
        <section className="order-1 bg-[#244777] text-white rounded-xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl text-center md:text-left">
            <span className="text-xs uppercase tracking-wider text-[#DBE8F8] font-semibold">
              Khusus BEM, Himpunan, & Komunitas Kampus
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ajukan Event Kampusmu Secara Resmi
            </h2>
            <p className="text-xs sm:text-sm text-[#E5ECF5]">
              Semua pengajuan akan divalidasi dan ditinjau admin sebelum dipublikasikan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateEvent}
            className="px-6 py-3 bg-[#FFFCF6] text-[#244777] font-bold text-sm rounded-lg hover:bg-[#E5ECF5] active:scale-95 transition-transform whitespace-nowrap cursor-pointer shadow-md"
          >
            Buat Event Sekarang &rarr;
          </button>
        </section>

        {/* Section 2: Event Terbaru */}
        <section className="order-4 flex flex-col gap-6">
          <div className="flex items-end justify-between border-b border-[#E4DCCF] pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#29374A] tracking-tight">Event Terbaru</h2>
              <p className="text-xs sm:text-sm text-[#6F7580] mt-1">
                Baru saja ditambahkan oleh berbagai universitas dan komunitas kampus
              </p>
            </div>
            <Link
              href="/event?sortBy=terbaru"
              className="text-xs sm:text-sm font-semibold text-[#315E9E] hover:text-[#244777] flex items-center gap-1 transition"
            >
              <span>Lihat Semua</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[#FFFCF6] border border-[#ECE5DA] rounded-xl h-72 animate-pulse p-4 flex flex-col justify-between">
                  <div className="bg-[#E4DCCF] h-40 rounded-md w-full" />
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-[#E4DCCF] rounded w-3/4" />
                    <div className="h-3 bg-[#EAE2D4] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FFFCF6] border border-[#ECE5DA] rounded-xl text-sm text-[#6F7580]">
              Belum ada event terbaru yang tersedia saat ini.
            </div>
          )}
        </section>

        {/* Section 3: Kategori Pilihan Grid */}
        <section className="order-5 flex flex-col gap-5 card-sand border rounded-xl p-6 sm:p-8 shadow-sm">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#29374A] tracking-tight">Jelajahi Berdasarkan Kategori</h2>
            <p className="text-xs text-[#6F7580] mt-1">Pilih jenis kegiatan yang sesuai dengan minat dan tujuan akademikmu</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat, index) => (
              <Link
                key={cat.name}
                href={`/event?category=${encodeURIComponent(cat.name)}`}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition text-center group ${
                  index % 3 === 0
                    ? "card-royal hover:brightness-95"
                    : index % 3 === 1
                      ? "card-sage hover:brightness-95"
                      : "card-coral hover:brightness-95"
                }`}
              >
                <CategoryIcon name={cat.icon} className={`mb-1 h-7 w-7 group-hover:scale-110 transition-transform ${
                  index % 3 === 0 ? "card-text-royal" : index % 3 === 1 ? "card-text-sage" : "card-text-coral"
                }`} />
                <span className={`text-xs font-bold ${
                  index % 3 === 0 ? "card-heading-royal" : index % 3 === 1 ? "card-heading-sage" : "card-heading-coral"
                }`}>{cat.name}</span>
                <span className="text-[10px] text-[#6F7580] mt-0.5">{cat.count}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 4: Event Populer */}
        <section className="order-2 flex flex-col gap-6">
          <div className="flex items-end justify-between border-b border-[#E4DCCF] pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#29374A] tracking-tight">Event Populer</h2>
              <p className="text-xs sm:text-sm text-[#6F7580] mt-1">
                Paling banyak dilihat dan diminati mahasiswa saat ini
              </p>
            </div>
            <Link
              href="/event?sortBy=populer"
              className="text-xs sm:text-sm font-semibold text-[#315E9E] hover:text-[#244777] flex items-center gap-1 transition"
            >
              <span>Lihat Semua</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[#FFFCF6] border border-[#ECE5DA] rounded-xl h-72 animate-pulse p-4 flex flex-col justify-between">
                  <div className="bg-[#E4DCCF] h-40 rounded-md w-full" />
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-[#E4DCCF] rounded w-3/4" />
                    <div className="h-3 bg-[#EAE2D4] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : popularEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FFFCF6] border border-[#ECE5DA] rounded-xl text-sm text-[#6F7580]">
              Belum ada event dengan tingkat pendaftaran tinggi saat ini.
            </div>
          )}
        </section>

        {/* Section 5: Deadline Terdekat */}
        <section className="order-3 flex flex-col gap-6">
          <div className="flex items-end justify-between border-b border-[#E4DCCF] pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#29374A] tracking-tight">Deadline Terdekat</h2>
              <p className="text-xs sm:text-sm text-[#6F7580] mt-1">
                Registrasi hampir ditutup, segera daftarkan dirimu sebelum kuota habis!
              </p>
            </div>
            <Link
              href="/event?sortBy=deadline-terdekat"
              className="text-xs sm:text-sm font-semibold text-[#315E9E] hover:text-[#244777] flex items-center gap-1 transition"
            >
              <span>Lihat Semua</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[#FFFCF6] border border-[#ECE5DA] rounded-xl h-72 animate-pulse p-4 flex flex-col justify-between">
                  <div className="bg-[#E4DCCF] h-40 rounded-md w-full" />
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-[#E4DCCF] rounded w-3/4" />
                    <div className="h-3 bg-[#EAE2D4] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : deadlineEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {deadlineEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FFFCF6] border border-[#ECE5DA] rounded-xl text-sm text-[#6F7580]">
              Belum ada event dengan deadline terdekat saat ini.
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
