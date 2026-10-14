import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kalender Event | EventHub Kampus",
  description: "Lihat agenda dan jadwal seluruh kegiatan kampus dalam tampilan kalender bulanan.",
};

export default function CalendarPage() {
  const daysOfWeek = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kalender Event</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pantau seluruh jadwal kegiatan, workshop, dan kompetisi berdasarkan tanggal pelaksanaan
        </p>
      </div>

      {/* Calendar & Selected Date Schedule Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid Box (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-6 shadow-xs">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Oktober 2026</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                &larr; Bulan Lalu
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-md hover:bg-gray-800 cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Bulan Depan &rarr;
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 border-b border-gray-100 pb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Date Cells */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day) => {
              const hasEvent = day === 14 || day === 28;
              const isSelected = day === 14;
              return (
                <div
                  key={day}
                  className={`min-h-[70px] sm:min-h-[80px] p-2 border rounded-md flex flex-col justify-between transition cursor-pointer ${
                    isSelected
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <span className={`text-xs font-semibold ${isSelected ? "text-gray-900" : "text-gray-600"}`}>
                    {day}
                  </span>
                  {hasEvent && (
                    <span className="text-[10px] truncate bg-gray-900 text-white px-1.5 py-0.5 rounded font-medium mt-1">
                      {day === 14 ? "Workshop UI/UX" : "Seminar AI"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda for Selected Day Shell */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4 shadow-xs">
            <div className="border-b border-gray-100 pb-3">
              <span className="text-xs text-gray-400 uppercase font-semibold">Agenda Terpilih</span>
              <h3 className="text-lg font-bold text-gray-900">Rabu, 14 Oktober 2026</h3>
            </div>

            {/* Event Item */}
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 hover:border-gray-400 transition">
              <span className="text-xs font-semibold text-emerald-600">09:00 - 12:00 WIB</span>
              <h4 className="text-sm font-bold text-gray-900">
                Workshop UI/UX Design System Modern
              </h4>
              <p className="text-xs text-gray-500">Lab Komputer Gedung B</p>
              <Link
                href="/event/1"
                className="text-xs font-semibold text-gray-900 hover:underline pt-2 border-t border-gray-100"
              >
                Lihat Detail Event &rarr;
              </Link>
            </div>

            <div className="text-xs text-gray-400 text-center py-4">
              Tidak ada event lain pada tanggal ini.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
