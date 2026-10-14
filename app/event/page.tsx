import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Daftar Event | EventHub Kampus",
  description: "Daftar lengkap kegiatan kampus, workshop, seminar, dan perlombaan terkini.",
};

export default function EventListPage() {
  const categories = ["Semua", "Seminar", "Workshop", "Lomba", "Konser & Musik", "Olahraga"];

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Eksplorasi Daftar Event</h1>
        <p className="text-sm text-gray-500 mt-1">
          Temukan dan ikuti aktivitas terbaik untuk mendukung minat dan potensimu di kampus
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Categories Tab */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat, idx) => (
            <button
              key={cat}
              type="button"
              className={`px-4 py-2 text-xs font-semibold rounded-md transition whitespace-nowrap cursor-pointer ${
                idx === 0
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter / Sort Shell */}
        <div className="flex items-center gap-3">
          <select
            aria-label="Urutkan Event"
            className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-md text-gray-700 cursor-pointer"
          >
            <option>Terbaru</option>
            <option>Paling Populer</option>
            <option>Waktu Terdekat</option>
          </select>
        </div>
      </div>

      {/* Event Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs hover:border-gray-400 transition flex flex-col"
          >
            <div className="h-44 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
              Poster Event #{item}
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    Seminar
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold">Gratis</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-2 line-clamp-2">
                  Seminar Nasional: Inovasi AI dalam Ekosistem Pendidikan Tinggi
                </h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  Pembahasan mendalam seputar tren teknologi masa depan serta dampaknya bagi mahasiswa.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>📍 Gedung Serbaguna</span>
                <Link
                  href={`/event/${item}`}
                  className="font-semibold text-gray-900 hover:underline"
                >
                  Lihat Detail &rarr;
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          type="button"
          className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          disabled
        >
          Sebelumnya
        </button>
        <span className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-md">1</span>
        <span className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-md text-gray-700">2</span>
        <span className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-md text-gray-700">3</span>
        <button
          type="button"
          className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
