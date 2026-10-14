"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getEventById, events } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import EventCard from "@/components/EventCard";

type Props = {
  params: Promise<{ id: string }>;
};

export default function EventDetailPage({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);
  const { user, isLoggedIn } = useAuth();

  // Find event by ID, or fallback to the first event
  const event = getEventById(id) || events[0];

  // Interactive States
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [ticketCode, setTicketCode] = useState("");

  const formattedDate = new Date(event.date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const priceDisplay =
    event.price === 0
      ? "Gratis"
      : `Rp ${event.price.toLocaleString("id-ID")}`;

  // Other related events in the same category or other events
  const relatedEvents = events.filter((e) => e.id !== event.id).slice(0, 3);

  const handleOpenRegistration = () => {
    if (!isLoggedIn) {
      alert("Silakan masuk/login terlebih dahulu untuk mendaftar event.");
      router.push("/login");
      return;
    }
    setShowModal(true);
    setRegistrationSuccess(false);
  };

  const handleConfirmRegistration = () => {
    const generatedTicket = `EVT-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketCode(generatedTicket);
    setRegistrationSuccess(true);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-16 py-8 flex flex-col gap-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900 transition">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/event" className="hover:text-gray-900 transition">
          Daftar Event
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold truncate max-w-xs sm:max-w-md">
          {event.title}
        </span>
      </nav>

      {/* Hero / Banner Image with next/image */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden border border-gray-300 shadow-sm bg-gray-100">
        <Image
          src={event.image}
          alt={event.title}
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1200px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 sm:p-8">
          <div className="flex items-center gap-2 text-white">
            <span className="px-3 py-1 bg-white/90 text-gray-900 text-xs font-bold rounded-md backdrop-blur-xs">
              {event.category}
            </span>
            <span className="px-3 py-1 bg-black/70 text-white text-xs font-medium rounded-md backdrop-blur-xs">
              {event.organizer}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300">
                {event.category}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Pendaftaran Dibuka
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {event.title}
            </h1>

            <p className="text-xs sm:text-sm text-gray-500">
              Diselenggarakan oleh: <strong className="text-gray-800">{event.organizer}</strong>
            </p>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Deskripsi Event */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-gray-900">Deskripsi Event</h2>
            <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-3">
              <p>{event.description}</p>
              <p>
                Kegiatan ini dirancang khusus bagi mahasiswa yang ingin mengembangkan wawasan, mengasah keterampilan praktis, serta membangun jejaring profesional bersama pembicara dan sesama pegiat kampus di seluruh Indonesia.
              </p>
              <p>
                Setiap peserta yang terdaftar dan menghadiri acara secara penuh berhak mendapatkan e-certificate resmi, akses materi presentasi eksklusif, serta peluang networking.
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Persyaratan Peserta */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-gray-900">Persyaratan Peserta</h2>
            <ul className="flex flex-col gap-2 text-xs sm:text-sm text-gray-600">
              {event.requirements && event.requirements.length > 0 ? (
                event.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gray-900 font-bold">&bull;</span>
                    <span>{req}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-900 font-bold">&bull;</span>
                    <span>Mahasiswa aktif jenjang D3/D4/S1 dibuktikan dengan Kartu Tanda Mahasiswa (KTM).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-900 font-bold">&bull;</span>
                    <span>Melakukan registrasi online melalui platform EventHub Kampus.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-900 font-bold">&bull;</span>
                    <span>Hadir 15 menit sebelum kegiatan dimulai dan mematuhi tata tertib.</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Sidebar Informasi Penting & Action */}
        <div className="flex flex-col gap-6">
          <aside className="bg-white border border-gray-300 rounded-xl p-6 shadow-xs flex flex-col gap-5 sticky top-28">
            <h2 className="text-base font-bold text-gray-900">Informasi Penting</h2>
            <div className="h-px bg-gray-200" />

            <div className="flex flex-col gap-4 text-xs sm:text-sm">
              {/* Kategori */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-sm shrink-0">
                  🏷️
                </div>
                <div>
                  <span className="block text-[11px] text-gray-400">Kategori</span>
                  <span className="font-semibold text-gray-800">{event.category}</span>
                </div>
              </div>

              {/* Tanggal & Waktu */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-sm shrink-0">
                  📅
                </div>
                <div>
                  <span className="block text-[11px] text-gray-400">Tanggal & Waktu</span>
                  <span className="font-semibold text-gray-800">{formattedDate}</span>
                  <span className="block text-xs text-gray-500">{event.time || "09:00 - 13:00 WIB"}</span>
                </div>
              </div>

              {/* Lokasi */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-sm shrink-0">
                  📍
                </div>
                <div>
                  <span className="block text-[11px] text-gray-400">Lokasi Pelaksanaan</span>
                  <span className="font-semibold text-gray-800">{event.location}</span>
                </div>
              </div>

              {/* Biaya */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-sm shrink-0">
                  🎟️
                </div>
                <div>
                  <span className="block text-[11px] text-gray-400">Biaya Registrasi</span>
                  <span className="text-base font-extrabold text-gray-900">{priceDisplay}</span>
                </div>
              </div>

              {/* Kuota */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-sm shrink-0">
                  👥
                </div>
                <div>
                  <span className="block text-[11px] text-gray-400">Kuota Peserta</span>
                  <span className="font-semibold text-gray-800">
                    {event.registeredCount || 155} / {event.quota || 200} Mahasiswa
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleOpenRegistration}
                className="w-full py-3 bg-gray-900 text-white font-bold text-sm rounded-md hover:bg-gray-800 transition cursor-pointer text-center shadow-xs"
              >
                {event.price === 0 ? "Daftar Event Sekarang" : "Beli Tiket Event"}
              </button>

              <button
                type="button"
                onClick={() => setIsSaved(!isSaved)}
                className={`w-full py-2.5 border text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isSaved
                    ? "bg-gray-100 border-gray-400 text-gray-900"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{isSaved ? "★ Disimpan di Wishlist" : "☆ Simpan Event"}</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom Section: Event Terkait Lainnya */}
      <div className="pt-8 border-t border-gray-200 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Event Terkait Lainnya</h2>
          <Link href="/event" className="text-xs font-semibold text-gray-600 hover:text-gray-900">
            Jelajahi Semua &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedEvents.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      </div>

      {/* Modal Simulasi Pendaftaran / Pembelian Tiket */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-gray-300 rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            {!registrationSuccess ? (
              <>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <h3 className="text-base font-bold text-gray-900">
                    Konfirmasi {event.price === 0 ? "Pendaftaran" : "Pembelian Tiket"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col gap-3 text-xs sm:text-sm">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-1">
                    <span className="font-bold text-gray-900">{event.title}</span>
                    <span className="text-gray-500 text-xs">📅 {formattedDate}</span>
                    <span className="text-gray-500 text-xs">📍 {event.location}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-100 text-xs">
                    <span className="text-gray-500">Nama Pendaftar:</span>
                    <span className="font-semibold text-gray-800">{user?.name || "Muhammad Fauzan"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 text-xs">
                    <span className="text-gray-500">Email Kampus:</span>
                    <span className="font-semibold text-gray-800">{user?.email || "fauzan@mahasiswa.ac.id"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 text-xs">
                    <span className="text-gray-500">Total Biaya:</span>
                    <span className="font-extrabold text-gray-900 text-sm">{priceDisplay}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRegistration}
                    className="flex-1 py-2.5 bg-gray-900 text-white rounded-md text-xs font-bold hover:bg-gray-800 cursor-pointer"
                  >
                    Konfirmasi Sekarang
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
                  ✓
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-gray-900">Pendaftaran Berhasil!</h3>
                  <p className="text-xs text-gray-500">
                    Tiket event telah diterbitkan dan tersimpan di akun Anda.
                  </p>
                </div>

                <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs flex flex-col gap-1">
                  <span className="text-gray-400">KODE TIKET RESMI</span>
                  <span className="text-base font-mono font-bold text-gray-900">{ticketCode}</span>
                  <span className="text-[11px] text-gray-500">Tunjukkan kode ini saat registrasi ulang</span>
                </div>

                <div className="flex gap-2 w-full mt-2">
                  <Link
                    href="/profil"
                    className="flex-1 py-2.5 bg-gray-900 text-white rounded-md text-xs font-bold hover:bg-gray-800 text-center transition"
                  >
                    Lihat di Profil Saya
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
