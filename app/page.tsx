"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventCard from "@/components/EventCard";
import { apiGetEvents } from "@/lib/api";
import { Event } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getPopularityLabel, getRegistrationPercentage } from "@/lib/event-popularity";

/** Returns days until a date string (YYYY-MM-DD), or null */
function getDaysUntil(dateStr: string | undefined, todayTime: number | null): number | null {
  if (!dateStr || !todayTime) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const diff = Math.ceil((target.getTime() - todayTime) / (1000 * 60 * 60 * 24));
  return diff;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Lomba: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Seminar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Beasiswa: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5" />
    </svg>
  ),
  Workshop: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Organisasi: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Technopreneurship: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Lainnya: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
};

function EventGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-white border border-gray-200 rounded-xl h-64 animate-pulse overflow-hidden">
          <div className="bg-gray-200 h-36 w-full" />
          <div className="p-3.5 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HomePageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [todayTime] = useState<number>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    apiGetEvents({ sortBy: "terbaru" })
      .then((data) => {
        if (isMounted) { setEvents(data); setError(null); setIsLoading(false); }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Gagal mengambil event:", err);
          setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data event dari database.");
          setIsLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [reloadTrigger]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(searchQuery.trim() ? `/event?search=${encodeURIComponent(searchQuery.trim())}` : "/event");
  };

  const handleCreateEvent = () => {
    if (!user) router.push("/login");
    else if (user.role === "user") router.push("/pengajuan-event");
    else router.push("/dashboard");
  };

  const recentEvents = events.slice(0, 3);
  const popularEvents = events
    .filter((e) => getPopularityLabel(e))
    .sort((a, b) => getRegistrationPercentage(b) - getRegistrationPercentage(a))
    .slice(0, 3);
  const deadlineEvents = [...events]
    .filter((e) => e.registrationDeadline)
    .filter((e) => !["completed", "cancelled"].includes(e.status || ""))
    .filter((e) => {
      if (!e.registrationDeadline) return false;
      const deadline = new Date(`${e.registrationDeadline}T23:59:59`);
      return deadline.getTime() >= todayTime;
    })
    .sort((a, b) => (a.registrationDeadline ?? "").localeCompare(b.registrationDeadline ?? ""))
    .slice(0, 4);

  const categories = [
    { name: "Lomba", href: "/event?category=Lomba" },
    { name: "Seminar", href: "/event?category=Seminar" },
    { name: "Beasiswa", href: "/event?category=Beasiswa" },
    { name: "Workshop", href: "/event?category=Workshop" },
    { name: "Organisasi", href: "/event?category=Organisasi" },
    { name: "Technopreneurship", href: "/event?category=Technopreneurship" },
    { name: "Lainnya", href: "/event" },
  ];

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
              onClick={() => { setIsLoading(true); setReloadTrigger((p) => p + 1); }}
              className="text-xs font-bold underline hover:text-red-900 cursor-pointer ml-4"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Main Grid: left content + right sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Hero Text */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
                Temukan Event Kampus,{" "}
                <span className="text-blue-700">Jangan Lewatkan Peluang</span>
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Lomba, seminar, beasiswa, dan kegiatan mahasiswa dalam satu platform.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mt-5 flex items-center gap-2 bg-white border border-gray-300 rounded-xl shadow-sm px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari lomba, seminar, beasiswa, atau topik event..."
                  className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 text-white font-semibold text-sm rounded-lg hover:bg-blue-800 active:scale-95 transition-all shrink-0"
                >
                  Cari
                </button>
              </form>

              {/* Category Pills */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700 font-medium hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition shadow-sm"
                  >
                    {CATEGORY_ICONS[cat.name]}
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Verified Info Notice */}
            <div className="flex items-center gap-2 min-h-11 text-xs leading-5 text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Semua event telah melalui proses kurasi untuk memastikan keabsahan dan relevansinya bagi mahasiswa.</span>
            </div>

            {/* Event Terbaru */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Event Terbaru</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Event terkini yang baru saja ditambahkan. Jangan sampai ketinggalan!</p>
                </div>
                <Link href="/event?sortBy=terbaru" className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 transition shrink-0">
                  Lihat Semua Event →
                </Link>
              </div>
              {isLoading ? (
                <EventGridSkeleton />
              ) : recentEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recentEvents.map((evt) => <EventCard key={evt.id} event={evt} />)}
                </div>
              ) : (
                <div className="p-8 text-center bg-white border border-gray-200 rounded-xl text-sm text-gray-500">
                  Belum ada event terbaru yang tersedia saat ini.
                </div>
              )}
            </section>

            {/* Event Populer */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Event Populer</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Event dengan paling banyak diminati oleh mahasiswa.</p>
                </div>
                <Link href="/event?sortBy=populer" className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 transition shrink-0">
                  Lihat Semua Event →
                </Link>
              </div>
              {isLoading ? (
                <EventGridSkeleton />
              ) : popularEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {popularEvents.map((evt) => <EventCard key={evt.id} event={evt} />)}
                </div>
              ) : (
                <div className="p-8 text-center bg-white border border-gray-200 rounded-xl text-sm text-gray-500">
                  Belum ada event populer saat ini.
                </div>
              )}
            </section>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="flex flex-col gap-6">
            {/* Promotional Banner */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Lebih dari Event, Lebih Banyak Peluang</span>
                <h3 className="mt-2 text-xl font-extrabold text-blue-900 leading-tight">
                  Untuk<br/>Masa Depan<br/>yang Lebih Besar
                </h3>
                <p className="mt-2 text-xs text-blue-700 leading-relaxed">
                  Jelajahi ribuan kesempatan, kembangkan potensi, dan perluas jejaringmu bersama EventHub Kampus.
                </p>
                <div className="mt-3 flex flex-col gap-1 text-xs text-blue-800">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Ide Kegiatan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Peluang Masa Depan</span>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-blue-500 font-medium">Dari Mahasiswa, Untuk Mahasiswa</p>
              </div>
              {/* Decorative campus illustration placeholder */}
              <div className="absolute right-0 bottom-0 w-24 h-24 opacity-20">
                <svg viewBox="0 0 100 100" fill="currentColor" className="text-blue-400">
                  <rect x="30" y="40" width="40" height="50" rx="2"/>
                  <rect x="40" y="20" width="20" height="20" rx="1"/>
                  <rect x="45" y="10" width="10" height="12"/>
                  <circle cx="50" cy="8" r="4"/>
                </svg>
              </div>
            </div>

            {/* Deadline Terdekat */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth="2"/>
                    <path d="M12 7v5l3 3" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <h3 className="font-bold text-gray-900">Deadline Terdekat</h3>
                </div>
                <Link href="/kalender" className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition">
                  Lihat Kalender →
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex gap-3 animate-pulse">
                      <div className="w-12 h-14 bg-gray-200 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 w-20 bg-gray-200 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : deadlineEvents.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {deadlineEvents.map((evt) => {
                    const daysLeft = getDaysUntil(evt.registrationDeadline, todayTime);
                    const deadlineDate = evt.registrationDeadline
                      ? new Date(`${evt.registrationDeadline}T00:00:00`)
                      : null;
                    const dayNum = deadlineDate
                      ? deadlineDate.toLocaleDateString("id-ID", { day: "numeric" })
                      : "--";
                    const monthAbbr = deadlineDate
                      ? deadlineDate.toLocaleDateString("id-ID", { month: "short" })
                      : "";

                    return (
                      <Link
                        key={evt.id}
                        href={`/event/${evt.id}`}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition group"
                      >
                        {/* Date Block */}
                        <div className="w-12 shrink-0 flex flex-col items-center justify-center bg-amber-50 border border-amber-200 rounded-lg py-2 text-center">
                          <span className="text-lg font-extrabold text-amber-700 leading-none">{dayNum}</span>
                          <span className="text-[10px] font-semibold text-amber-600 uppercase">{monthAbbr}</span>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-700 transition">
                            {evt.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{evt.organizer}</p>
                          {daysLeft !== null && daysLeft > 0 && (
                            <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                              {daysLeft} hari lagi
                            </span>
                          )}
                          {daysLeft !== null && daysLeft <= 0 && (
                            <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                              Sudah tutup
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">Tidak ada deadline mendatang.</p>
              )}

            </div>

            {/* CTA Ajukan Event */}
            <div className="bg-blue-700 rounded-xl p-5 text-white">
              <h3 className="font-bold text-base">Punya event kampus?</h3>
              <p className="text-sm text-blue-200 mt-1">Ajukan event dan jangkau ribuan mahasiswa Indonesia.</p>
              <button
                type="button"
                onClick={handleCreateEvent}
                className="mt-4 w-full py-2.5 bg-white text-blue-700 font-bold text-sm rounded-lg hover:bg-blue-50 active:scale-95 transition-all"
              >
                Ajukan Event Sekarang →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-6" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
