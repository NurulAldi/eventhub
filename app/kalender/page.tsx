"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { apiGetEvents } from "@/lib/api";
import { Event } from "@/types";

/** Returns days until a date string (YYYY-MM-DD), or null */
function getDaysUntil(dateStr: string | undefined, todayTime: number | null): number | null {
  if (!dateStr || !todayTime) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const diff = Math.ceil((target.getTime() - todayTime) / (1000 * 60 * 60 * 24));
  return diff;
}

const CATEGORY_DOT_COLOR: Record<string, string> = {
  Lomba: "bg-red-500",
  Seminar: "bg-purple-500",
  Beasiswa: "bg-green-500",
  Workshop: "bg-yellow-500",
  Organisasi: "bg-blue-500",
  Technopreneurship: "bg-cyan-500",
};

const CATEGORY_TEXT_COLOR: Record<string, string> = {
  Lomba: "text-red-700",
  Seminar: "text-purple-700",
  Beasiswa: "text-green-700",
  Workshop: "text-yellow-700",
  Organisasi: "text-blue-700",
  Technopreneurship: "text-cyan-700",
};

const CATEGORY_BADGE_COLOR: Record<string, string> = {
  Lomba: "bg-red-100 text-red-700",
  Seminar: "bg-purple-100 text-purple-700",
  Beasiswa: "bg-green-100 text-green-700",
  Workshop: "bg-orange-100 text-orange-700",
  Organisasi: "bg-blue-100 text-blue-700",
  Technopreneurship: "bg-cyan-100 text-cyan-700",
};

function getInitialToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return {
    year: today.getFullYear(),
    month: today.getMonth(),
    iso: todayStr,
    time: today.getTime(),
  };
}

function CalendarPageContent() {
  const [initialToday] = useState(getInitialToday);
  const [currentYear, setCurrentYear] = useState<number>(initialToday.year);
  const [currentMonth, setCurrentMonth] = useState<number>(initialToday.month);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(initialToday.iso);
  const todayISO = initialToday.iso;
  const todayTime = initialToday.time;
  const [activeView, setActiveView] = useState<"bulan" | "minggu" | "agenda">("bulan");

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCalendarEvents() {
      try {
        const data = await apiGetEvents({ sortBy: "deadline-terdekat" });
        if (isMounted) {
          setEvents(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Gagal memuat event untuk kalender:", err);
          setError("Gagal memuat event dari database.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCalendarEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const handlePrevMonth = () => {
    if (currentYear === null || currentMonth === null) return;
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const handleNextMonth = () => {
    if (currentYear === null || currentMonth === null) return;
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr([
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-"));
  };

  const firstDayOfMonth = currentYear === null || currentMonth === null
    ? 0 : new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = currentYear === null || currentMonth === null
    ? 0 : new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const formatISO = (day: number) => {
    const m = String((currentMonth ?? 0) + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${currentYear ?? 0}-${m}-${d}`;
  };

  const getEventsForDate = (dateStr: string): Event[] =>
    events.filter((e) => e.date === dateStr);

  const selectedDayEvents = selectedDateStr ? getEventsForDate(selectedDateStr) : [];

  const [selectedYear, selectedMonth, selectedDay] = (selectedDateStr || "").split("-").map(Number);
  const selectedDateFormatted = selectedDateStr
    ? new Date(selectedYear, selectedMonth - 1, selectedDay).toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "Tanggal belum dipilih";

  // Deadline events sorted
  const deadlineEvents = [...events]
    .filter((e) => e.registrationDeadline)
    .filter((e) => !["completed", "cancelled"].includes(e.status || ""))
    .filter((e) => {
      if (!e.registrationDeadline) return false;
      const deadline = new Date(`${e.registrationDeadline}T23:59:59`);
      return deadline.getTime() >= todayTime;
    })
    .sort((a, b) => (a.registrationDeadline ?? "").localeCompare(b.registrationDeadline ?? ""))
    .slice(0, 5);

  // First event on selected date (for detail panel)
  const detailEvent = selectedDayEvents[0] ?? null;

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-72 bg-gray-200 rounded" />
            <div className="flex gap-6 mt-6">
              <div className="flex-1 h-[560px] bg-gray-200 rounded-xl" />
              <div className="w-72 h-[560px] bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">

        {/* Page Header + Banner Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kalender Event</h1>
            <p className="mt-1 text-sm text-gray-500">
              Temukan dan ikuti berbagai lomba, seminar, beasiswa, dan workshop mahasiswa.
            </p>
          </div>
          {/* Promo Banner */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Jangan lewatkan kesempatan berharga untuk mengembangkan potensi dirimu!</p>
              <p className="text-xs text-blue-600 mt-0.5">Simpan tanggal penting dan ikuti event favoritmu.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => window.location.reload()} className="text-xs font-bold underline cursor-pointer">
              Coba Lagi
            </button>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Column */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Calendar Controls */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                {/* Prev/Next */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-700 transition cursor-pointer"
                    aria-label="Bulan Sebelumnya"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-700 transition cursor-pointer"
                    aria-label="Bulan Berikutnya"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={goToToday}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700 transition cursor-pointer ml-1"
                  >
                    Hari Ini
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentMonth !== null && currentYear !== null
                    ? `${monthNames[currentMonth]} ${currentYear}`
                    : "Kalender"}
                  {" "}
                  <span className="text-gray-400">▼</span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {/* View Tabs */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1 text-sm">
                  {(["bulan", "minggu", "agenda"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setActiveView(v)}
                      className={`px-3 py-1 rounded-md font-medium transition cursor-pointer capitalize ${
                        activeView === v ? "bg-blue-700 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Legend */}
                <div className="hidden sm:flex items-center gap-3 text-xs text-gray-600">
                  {Object.entries(CATEGORY_DOT_COLOR).slice(0, 4).map(([cat, dotClass]) => (
                    <span key={cat} className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {daysOfWeek.map((day, idx) => (
                <div
                  key={day}
                  className={`py-2.5 text-center text-xs font-semibold uppercase tracking-wider ${
                    idx === 0 ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {/* Leading blanks (prev month days) */}
              {leadingBlanks.map((blank) => (
                <div
                  key={`blank-${blank}`}
                  className="min-h-[90px] border-b border-r border-gray-50 bg-gray-50/50 p-2"
                >
                  {/* Show prev month day number dimmed */}
                </div>
              ))}

              {/* Days in current month */}
              {daysArray.map((day, idx) => {
                const dateStr = formatISO(day);
                const dayEvents = getEventsForDate(dateStr);
                const isSelected = selectedDateStr === dateStr;
                const isToday = dateStr === todayISO;
                const hasEvents = dayEvents.length > 0;
                const isLastRow = idx >= daysArray.length - 7;
                const colIdx = (leadingBlanks.length + idx) % 7;

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`min-h-[90px] border-r border-b border-gray-100 p-2 cursor-pointer transition-colors flex flex-col ${
                      isSelected
                        ? "bg-blue-50 ring-2 ring-inset ring-blue-500"
                        : hasEvents
                        ? "hover:bg-gray-50"
                        : "hover:bg-gray-50"
                    } ${isLastRow ? "border-b-0" : ""} ${colIdx === 6 ? "border-r-0" : ""}`}
                  >
                    {/* Day Number */}
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${
                        isToday
                          ? "bg-blue-700 text-white"
                          : isSelected
                          ? "text-blue-700 font-bold"
                          : colIdx === 0
                          ? "text-red-500"
                          : "text-gray-700"
                      }`}
                    >
                      {day}
                    </span>

                    {/* Event dots + labels */}
                    {hasEvents && (
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((evt) => {
                          const dotClass = CATEGORY_DOT_COLOR[evt.category] ?? "bg-gray-400";
                          const textClass = CATEGORY_TEXT_COLOR[evt.category] ?? "text-gray-600";
                          return (
                            <div
                              key={evt.id}
                              className={`flex items-center gap-1 text-[10px] font-medium truncate ${textClass}`}
                              title={evt.title}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
                              <span className="truncate">{evt.title}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            +{dayEvents.length - 2} lagi
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Deadline Terdekat */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth="2"/>
                    <path d="M12 7v5l3 3" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <h3 className="font-bold text-gray-900">Deadline Terdekat</h3>
                </div>
                <Link href="/event?sortBy=deadline-terdekat" className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition">
                  Lihat Semua →
                </Link>
              </div>

              {deadlineEvents.length > 0 ? (
                <div className="flex flex-col divide-y divide-gray-100">
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
                        className="flex items-start gap-3 py-3 hover:bg-gray-50 rounded-lg px-1 transition group"
                      >
                        {/* Date Block */}
                        <div className="w-11 shrink-0 flex flex-col items-center justify-center bg-amber-50 border border-amber-200 rounded-lg py-1.5 text-center">
                          <span className="text-base font-extrabold text-amber-700 leading-none">{dayNum}</span>
                          <span className="text-[9px] font-semibold text-amber-600 uppercase">{monthAbbr}</span>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-700 transition leading-tight">
                            {evt.title}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{evt.organizer}</p>
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
                <p className="text-xs text-gray-500 text-center py-6">Tidak ada deadline mendatang.</p>
              )}
            </div>

            {/* Detail Event Panel */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm">Detail Event</h3>
                {detailEvent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[11px] font-semibold border border-green-100">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Terverifikasi
                  </span>
                )}
              </div>

              {selectedDayEvents.length > 0 && detailEvent ? (
                <div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_BADGE_COLOR[detailEvent.category] ?? "bg-gray-100 text-gray-700"}`}>
                    {detailEvent.category}
                  </span>
                  <h4 className="mt-2 text-base font-bold text-gray-900 leading-snug">
                    {detailEvent.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{detailEvent.organizer}</p>

                  <div className="mt-3 space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>
                        {new Date(detailEvent.date).toLocaleDateString("id-ID", {
                          weekday: "long", day: "numeric", month: "long", year: "numeric",
                        })}
                      </span>
                    </div>
                    {detailEvent.registrationDeadline && (
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9" strokeWidth="2"/>
                          <path d="M12 7v5l3 3" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span>
                          Deadline pendaftaran:{" "}
                          <strong className="text-orange-600">
                            {new Date(`${detailEvent.registrationDeadline}T00:00:00`).toLocaleDateString("id-ID", {
                              day: "numeric", month: "long", year: "numeric",
                            })}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/event/${detailEvent.id}`}
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition"
                  >
                    Lihat Detail
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {selectedDayEvents.length > 1 && (
                    <p className="mt-2 text-center text-xs text-gray-500">
                      +{selectedDayEvents.length - 1} event lain pada tanggal ini
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 flex flex-col items-center gap-2">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/>
                    <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">{selectedDateFormatted}</p>
                  <p className="text-xs text-gray-400">Tidak ada event pada tanggal ini.<br/>Pilih tanggal lain di kalender.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-72 bg-gray-200 rounded" />
              <div className="flex gap-6 mt-6">
                <div className="flex-1 h-[560px] bg-gray-200 rounded-xl" />
                <div className="w-72 h-[560px] bg-gray-200 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <CalendarPageContent />
    </Suspense>
  );
}
