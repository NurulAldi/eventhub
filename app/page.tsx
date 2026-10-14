import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Beranda | EventHub Kampus",
  description: "Temukan event kampus terbaikmu - seminar, workshop, kompetisi, dan kegiatan mahasiswa.",
};

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="bg-gray-100 border-b border-gray-200 py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-gray-300 text-gray-700">
            Platform Event Mahasiswa No. 1
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Temukan Event Kampus Terbaikmu
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-xl">
            Jelajahi seminar, workshop, lomba, dan berbagai kegiatan kemahasiswaan untuk meningkatkan keahlian dan relasimu.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full justify-center max-w-md">
            <Link
              href="/event"
              className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm rounded-md hover:bg-gray-800 transition text-center"
            >
              Jelajahi Semua Event
            </Link>
            <Link
              href="/kalender"
              className="px-6 py-3 bg-white text-gray-900 border border-gray-300 font-semibold text-sm rounded-md hover:bg-gray-50 transition text-center"
            >
              Lihat Kalender
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Event Pilihan Populer</h2>
            <p className="text-sm text-gray-500 mt-1">Event menarik yang paling banyak diikuti mahasiswa minggu ini</p>
          </div>
          <Link href="/event" className="text-sm font-semibold text-gray-900 hover:underline">
            Lihat Semua &rarr;
          </Link>
        </div>

        {/* Placeholder Event Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs hover:border-gray-400 transition"
            >
              <div className="h-44 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                Preview Poster Event #{item}
              </div>
              <div className="p-5 flex flex-col gap-3">
                <span className="self-start text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  Workshop
                </span>
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                  National Tech Workshop & Career Talk 2026
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  Tingkatkan kemampuan teknologimu bersama para profesional industri terkemuka.
                </p>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>📅 28 Okt 2026</span>
                  <Link href={`/event/${item}`} className="font-semibold text-gray-900 hover:underline">
                    Detail Event &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
