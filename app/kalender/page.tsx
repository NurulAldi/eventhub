"use client";

import { useState } from "react";
import Link from "next/link";
import { events } from "@/lib/mock-data";
import { Event } from "@/types";

export default function CalendarPage() {
  // Calendar month state (0-indexed month: 9 = Oktober, 10 = November)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 9 = Oktober 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-10-28");

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
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calculate days in the current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create grid cells: leading blanks + days of month
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Helper to format ISO date string: YYYY-MM-DD
  const formatISO = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${currentYear}-${m}-${d}`;
  };

  // Get events on a specific date
  const getEventsForDate = (dateStr: string): Event[] => {
    return events.filter((e) => e.date === dateStr);
  };

  // Events on the currently selected date
  const selectedDayEvents = getEventsForDate(selectedDateStr);

  // Formatted date label for selected date
  const selectedDateFormatted = new Date(selectedDateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Kalender Event Kampus
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Pantau seluruh jadwal kegiatan, workshop, lomba, dan seminar berdasarkan tanggal pelaksanaan
        </p>
      </div>

      {/* Main 2-Column Grid matching kalender-event.html */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Column: Calendar Grid Box */}
        <div className="flex-1 w-full bg-white border border-gray-300 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col gap-6">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md border border-gray-300">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition cursor-pointer"
                  aria-label="Bulan Sebelumnya"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition cursor-pointer"
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
                setCurrentYear(2026);
                setCurrentMonth(9);
                setSelectedDateStr("2026-10-28");
              }}
              className="text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition cursor-pointer"
            >
              Oktober 2026 (Demo)
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-gray-500 uppercase tracking-wider">
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
              <div key={`blank-${blank}`} className="h-20 sm:h-24 bg-gray-50/50 rounded-md border border-transparent" />
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
                      ? "border-gray-900 bg-gray-100/90 ring-2 ring-gray-900"
                      : hasEvents
                      ? "border-gray-400 bg-white hover:border-gray-900 hover:shadow-xs"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-gray-900" : hasEvents ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {day}
                    </span>
                    {hasEvents && (
                      <span className="w-2 h-2 rounded-full bg-gray-900 inline-block" />
                    )}
                  </div>

                  {/* Event Badges preview on date cell */}
                  {hasEvents && (
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {dayEvents.slice(0, 1).map((evt) => (
                        <div
                          key={evt.id}
                          className="text-[10px] truncate px-1.5 py-0.5 rounded bg-gray-900 text-white font-medium"
                          title={evt.title}
                        >
                          {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 1 && (
                        <span className="text-[9px] text-gray-500 font-bold">
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
          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-900" />
              <span>Ada Kegiatan Kampus</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-gray-900 bg-gray-100" />
              <span>Tanggal Terpilih</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Event Pada Tanggal Terpilih */}
        <aside className="w-full lg:w-96 bg-white border border-gray-300 rounded-xl p-6 shadow-xs flex flex-col gap-5 shrink-0">
          <div className="border-b border-gray-200 pb-3 flex flex-col gap-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              EVENT PADA TANGGAL INI
            </span>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 capitalize">
              {selectedDateFormatted}
            </h3>
          </div>

          {/* List of events on this date */}
          {selectedDayEvents.length > 0 ? (
            <div className="flex flex-col gap-4">
              {selectedDayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 bg-gray-50 border border-gray-300 rounded-lg flex flex-col gap-3 hover:border-gray-500 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-300 text-gray-800">
                      {evt.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {evt.price === 0 ? "Gratis" : `Rp ${evt.price.toLocaleString("id-ID")}`}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 line-clamp-2">
                    {evt.title}
                  </h4>

                  <div className="flex flex-col gap-1 text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <span>⏰</span>
                      <span>{evt.time || "09:00 - 13:00 WIB"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>📍</span>
                      <span className="truncate">{evt.location}</span>
                    </div>
                  </div>

                  <Link
                    href={`/event/${evt.id}`}
                    className="mt-1 w-full py-2 bg-gray-900 text-white text-xs font-bold rounded-md hover:bg-gray-800 text-center transition block"
                  >
                    Detail Event &rarr;
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center gap-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
              <span className="text-2xl">🗓️</span>
              <p className="text-xs text-gray-500">
                Tidak ada event yang terjadwal pada tanggal ini.
              </p>
              <button
                type="button"
                onClick={() => setSelectedDateStr("2026-10-28")}
                className="text-xs font-semibold text-gray-900 hover:underline cursor-pointer"
              >
                Lihat Agenda 28 Oktober (Seminar AI) &rarr;
              </button>
            </div>
          )}

          {/* Quick List: Agenda Mendatang Bulan Ini */}
          <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
            <span className="text-xs font-bold text-gray-800">Agenda Lainnya di Bulan Ini:</span>
            <div className="flex flex-col gap-2">
              {events.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedDateStr(item.date)}
                  className="p-2.5 rounded-md hover:bg-gray-100 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 line-clamp-1">{item.title}</span>
                    <span className="text-[11px] text-gray-400">{item.date}</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-600 shrink-0 ml-2">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
