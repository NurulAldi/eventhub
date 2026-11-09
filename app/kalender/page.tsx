"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGetEvents } from "@/lib/api";
import { Event } from "@/types";

export default function CalendarPage() {
  // Keep the initial render deterministic, then sync the calendar to the browser date.
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Dynamic events from database API
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const todayStr = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    async function loadCalendarEvents() {
      setIsLoading(true);
      setError(null);
      try {
        const [data] = await Promise.all([
          apiGetEvents(),
          new Promise<void>((resolve) => window.setTimeout(resolve, 0)),
        ]);
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
        setSelectedDateStr(todayStr);
        setEvents(data);
      } catch (err) {
        console.error("Gagal memuat event untuk kalender:", err);
        setError("Gagal memuat event dari database.");
      } finally {
        setIsLoading(false);
      }
    }

    loadCalendarEvents();
  }, []);

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentYear === null || currentMonth === null) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentYear === null || currentMonth === null) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calculate days in the current month
  const firstDayOfMonth = currentYear === null || currentMonth === null
    ? 0
    : new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = currentYear === null || currentMonth === null
    ? 0
    : new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create grid cells: leading blanks + days of month
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Helper to format ISO date string: YYYY-MM-DD
  const formatISO = (day: number) => {
    const m = String((currentMonth ?? 0) + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${currentYear ?? 0}-${m}-${d}`;
  };

  // Get events on a specific date
  const getEventsForDate = (dateStr: string): Event[] => {
    return events.filter((e) => e.date === dateStr);
  };

  // Events on the currently selected date
  const selectedDayEvents = selectedDateStr ? getEventsForDate(selectedDateStr) : [];

  // Formatted date label for selected date
  const [selectedYear, selectedMonth, selectedDay] = (selectedDateStr || "").split("-").map(Number);
  const selectedDateFormatted = selectedDateStr
    ? new Date(selectedYear, selectedMonth - 1, selectedDay).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    })
    : "Tanggal belum dipilih";

  if (isLoading) {
    return (
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-10 flex flex-col gap-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 rounded bg-[#E4DCCF]" />
          <div className="mt-2 h-4 w-96 max-w-full rounded bg-[#F0E9DC]" />
        </div>
        <div className="flex flex-col lg:flex-row items-start gap-8 animate-pulse">
          <div className="flex-1 w-full h-[620px] rounded-xl bg-[#F0E9DC] border border-[#E4DCCF]" />
          <div className="w-full lg:w-96 h-80 rounded-xl bg-[#F0E9DC] border border-[#E4DCCF]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29374A] tracking-tight">
          Kalender Event Kampus
        </h1>
        <p className="text-xs sm:text-sm text-[#6F7580] mt-1">
          Pantau seluruh jadwal kegiatan, workshop, lomba, dan seminar berdasarkan tanggal pelaksanaan
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs font-bold underline cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main 2-Column Grid matching kalender-event.html */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Column: Calendar Grid Box */}
        <div className="flex-1 w-full card-royal border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-6">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between border-b border-[#E4DCCF] pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#29374A]">
                {currentMonth === null || currentYear === null
                  ? "Kalender"
                  : `${monthNames[currentMonth]} ${currentYear}`}
              </h2>
              <div className="flex items-center gap-1 bg-[#F0E9DC] p-1 rounded-md border border-[#E4DCCF]">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 text-[#6F7580] hover:text-[#29374A] hover:bg-[#FFFCF6] rounded transition cursor-pointer"
                  aria-label="Bulan Sebelumnya"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 text-[#6F7580] hover:text-[#29374A] hover:bg-[#FFFCF6] rounded transition cursor-pointer"
                  aria-label="Bulan Berikutnya"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setCurrentYear(today.getFullYear());
                setCurrentMonth(today.getMonth());
                setSelectedDateStr([
                  today.getFullYear(),
                  String(today.getMonth() + 1).padStart(2, "0"),
                  String(today.getDate()).padStart(2, "0"),
                ].join("-"));
              }}
              className="text-xs font-semibold px-3 py-1.5 bg-[#F0E9DC] hover:bg-[#E4DCCF] text-[#29374A] rounded-md transition cursor-pointer"
            >
              Hari Ini
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-[#6F7580] uppercase tracking-wider">
            {daysOfWeek.map((day, idx) => (
              <div key={day} className={`py-1 ${idx === 0 ? "text-red-500" : ""}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Blank cells for padding */}
            {leadingBlanks.map((blank) => (
              <div key={`blank-${blank}`} className="h-20 sm:h-24 bg-[#F7F4EE]/50 rounded-md border border-transparent" />
            ))}

            {/* Days in current month */}
            {daysArray.map((day) => {
              const dateStr = formatISO(day);
              const dayEvents = getEventsForDate(dateStr);
              const isSelected = selectedDateStr === dateStr;
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-20 sm:h-24 p-2 rounded-md border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-[#244777] bg-[#F0E9DC]/90 ring-2 ring-[#244777]"
                      : hasEvents
                      ? "border-[#B9B2A7] bg-[#FFFCF6] hover:border-[#244777] hover:shadow-xs"
                      : "border-[#E4DCCF] bg-[#FFFCF6] hover:border-[#E4DCCF]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-[#29374A]" : hasEvents ? "text-[#29374A]" : "text-[#6F7580]"
                      }`}
                    >
                      {day}
                    </span>
                    {hasEvents && (
                      <span className="w-2 h-2 rounded-full bg-[#315E9E] inline-block" />
                    )}
                  </div>

                  {/* Event Badges preview on date cell */}
                  {hasEvents && (
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {dayEvents.slice(0, 1).map((evt) => (
                        <div
                          key={evt.id}
                          className="text-[10px] truncate px-1.5 py-0.5 rounded bg-[#315E9E] text-white font-medium"
                          title={evt.title}
                        >
                          {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 1 && (
                        <span className="text-[9px] text-[#6F7580] font-bold">
                          +{dayEvents.length - 1} event lagi
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-[#6F7580] pt-2 border-t border-[#ECE5DA]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#315E9E]" />
              <span>Ada Kegiatan Kampus</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-[#244777] bg-[#F0E9DC]" />
              <span>Tanggal Terpilih</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Event Pada Tanggal Terpilih */}
        <aside className="w-full lg:w-96 card-sand border rounded-xl p-6 shadow-sm flex flex-col gap-5 shrink-0">
          <div className="border-b border-[#E4DCCF] pb-3 flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#92959C] uppercase tracking-wider">
              EVENT PADA TANGGAL INI
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#29374A] capitalize">
              {selectedDateFormatted}
            </h3>
          </div>

          {/* List of events on this date */}
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#92959C] animate-pulse">
              Memuat event kalender...
            </div>
          ) : selectedDayEvents.length > 0 ? (
            <div className="flex flex-col gap-4">
              {selectedDayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 bg-[#F7F4EE] border border-[#E4DCCF] rounded-lg flex flex-col gap-3 hover:border-[#92959C] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFCF6] border border-[#E4DCCF] text-[#29374A]">
                      {evt.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {evt.price === 0 ? "Gratis" : `Rp ${evt.price.toLocaleString("id-ID")}`}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#29374A] line-clamp-2">
                    {evt.title}
                  </h4>

                  <div className="flex flex-col gap-1 text-xs text-[#6F7580] pt-2 border-t border-[#E4DCCF]">
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2.5" /></svg>
                      <span>{evt.time || "Waktu belum ditentukan"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></svg>
                      <span className="truncate">{evt.location}</span>
                    </div>
                  </div>

                  <Link
                    href={`/event/${evt.id}`}
                    className="mt-1 w-full py-2 bg-[#315E9E] text-white text-xs font-bold rounded-md hover:bg-[#244777] text-center transition block"
                  >
                    Detail Event &rarr;
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center gap-3 bg-[#F7F4EE] border border-dashed border-[#E4DCCF] rounded-lg">
              <svg className="h-8 w-8 text-[#6D95CC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16" /></svg>
              <p className="text-xs text-[#6F7580]">
                Tidak ada event yang terjadwal pada tanggal ini.
              </p>
            </div>
          )}

          {/* Quick List: Agenda Mendatang Bulan Ini */}
          <div className="pt-4 border-t border-[#E4DCCF] flex flex-col gap-3">
            <span className="text-xs font-bold text-[#29374A]">Agenda Lainnya di Bulan Ini:</span>
            <div className="flex flex-col gap-2">
              {events.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedDateStr(item.date)}
                  className="p-2.5 rounded-md hover:bg-[#F0E9DC] transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#29374A] line-clamp-1">{item.title}</span>
                    <span className="text-[11px] text-[#92959C]">{item.date}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#6F7580] shrink-0 ml-2">
                    {item.category}
                  </span>
                </div>
              ))}
              {events.length === 0 && (
                <span className="text-xs text-[#92959C]">Belum ada event terdaftar.</span>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
