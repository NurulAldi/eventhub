"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventCard from "@/components/EventCard";
import { events } from "@/lib/mock-data";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/event?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/event");
    }
  };

  // Filter events for different sections
  const recentEvents = events.slice(0, 3);
  const popularEvents = events.filter((e) => e.isPopular).slice(0, 3);
  const deadlineEvents = events.slice(3, 6);

  const categories = [
    { name: "Seminar", icon: "🎓", count: "12 Event" },
    { name: "Workshop", icon: "💻", count: "8 Event" },
    { name: "Lomba", icon: "🏆", count: "15 Event" },
    { name: "Beasiswa", icon: "📚", count: "6 Info" },
    { name: "Konser & Musik", icon: "🎵", count: "4 Event" },
    { name: "Olahraga", icon: "⚽", count: "7 Event" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Hero Section - Matching beranda.html */}
      <section className="bg-gray-100 border-b border-gray-300 py-16 sm:py-20 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 text-center">
          <div className="max-w-2xl flex flex-col gap-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Temukan Event Kampus Terbaikmu
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
              Pusat informasi kompetisi, seminar, beasiswa, dan pengabdian masyarakat terlengkap untuk mahasiswa seluruh Indonesia.
            </p>
          </div>

          {/* Search Box - Figma Style */}
          <form
            onSubmit={handleSearch}
            className="w-full max-w-2xl p-2 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center gap-3 transition focus-within:border-gray-900"
          >
            <div className="flex-1 flex items-center gap-2.5 px-3">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama event, kampus, atau penyelenggara..."
                className="w-full text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gray-900 text-white font-semibold text-xs sm:text-sm rounded-md hover:bg-gray-800 transition shrink-0 cursor-pointer"
            >
              Cari Event
            </button>
          </form>

          {/* Quick Category Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-gray-400 font-medium">Kategori Populer:</span>
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.name}
                href={`/event?category=${encodeURIComponent(cat.name)}`}
                className="text-xs bg-white border border-gray-300 hover:border-gray-900 text-gray-700 px-3 py-1 rounded-full transition"
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Sections - Matching beranda.html */}
      <main className="max-w-7xl w-full mx-auto px-6 lg:px-16 py-14 flex flex-col gap-14">
        {/* Section 1: Event Terbaru */}
        <section className="flex flex-col gap-6">
          <div className="flex items-end justify-between border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Event Terbaru</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Baru saja ditambahkan oleh berbagai universitas dan komunitas kampus
              </p>
            </div>
            <Link
              href="/event"
              className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1 transition"
            >
              <span>Lihat Semua</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        </section>

        {/* Section 2: Kategori Pilihan Grid */}
        <section className="flex flex-col gap-5 bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Jelajahi Berdasarkan Kategori</h2>
            <p className="text-xs text-gray-500 mt-1">Pilih jenis kegiatan yang sesuai dengan minat dan tujuan akademikmu</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/event?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition text-center group"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-bold text-gray-800">{cat.name}</span>
                <span className="text-[10px] text-gray-400 mt-0.5">{cat.count}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 3: Event Populer */}
        <section className="flex flex-col gap-6">
          <div className="flex items-end justify-between border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Event Populer</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Paling banyak dilihat dan diminati mahasiswa saat ini
              </p>
            </div>
            <Link
              href="/event"
              className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1 transition"
            >
              <span>Lihat Semua</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        </section>

        {/* Section 4: Deadline Terdekat */}
        <section className="flex flex-col gap-6">
          <div className="flex items-end justify-between border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Deadline Terdekat</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Registrasi hampir ditutup, segera daftarkan dirimu sebelum kuota habis!
              </p>
            </div>
            <Link
              href="/event"
              className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1 transition"
            >
              <span>Lihat Semua</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deadlineEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        </section>

        {/* Section 5: Organisasi Banner CTA */}
        <section className="bg-gray-900 text-white rounded-xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl text-center md:text-left">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Khusus BEM, Himpunan, & Komunitas Kampus
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Publikasikan Event Kampusmu Secara Gratis
            </h2>
            <p className="text-xs sm:text-sm text-gray-300">
              Jangkau ribuan mahasiswa dari berbagai perguruan tinggi di seluruh Indonesia dalam satu platform agregasi terintegrasi.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white text-gray-900 font-bold text-sm rounded-md hover:bg-gray-100 transition whitespace-nowrap cursor-pointer shadow-md"
          >
            Buat Event Sekarang &rarr;
          </Link>
        </section>
      </main>
    </div>
  );
}
