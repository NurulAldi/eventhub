"use client";

import Image from "next/image";
import Link from "next/link";
import { Event } from "@/types";
import { getPopularityLabel } from "@/lib/event-popularity";
import { getEventLifecycleStatus } from "@/lib/event-lifecycle";

interface EventCardProps {
  event: Event;
  showPrice?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Seminar: "bg-purple-100 text-purple-700",
  Lomba: "bg-red-100 text-red-700",
  Beasiswa: "bg-green-100 text-green-700",
  Workshop: "bg-orange-100 text-orange-700",
  Organisasi: "bg-blue-100 text-blue-700",
  Technopreneurship: "bg-cyan-100 text-cyan-700",
};

export default function EventCard({ event, showPrice = true }: EventCardProps) {
  const lifecycle = getEventLifecycleStatus(event);
  const isClosed = lifecycle.isClosed;
  const executionStatus = lifecycle.label;

  const popularityLabel = getPopularityLabel(event);
  const categoryColorClass = CATEGORY_COLORS[event.category] ?? "bg-gray-100 text-gray-700";

  const priceDisplay = event.price === 0
    ? "Gratis"
    : `Rp ${event.price.toLocaleString("id-ID")}`;

  const formattedDate = new Date(event.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <Link href={`/event/${event.id}`} className="block flex-1 flex flex-col">
        {/* Poster Image */}
        <div className="relative w-full h-40 bg-gray-100 overflow-hidden shrink-0">
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Badges on image */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {!isClosed && !executionStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-green-700 text-[11px] font-semibold shadow-sm border border-green-100">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Terverifikasi
              </span>
            )}
            {(isClosed || executionStatus) && (
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                executionStatus === "Berlangsung"
                  ? "bg-emerald-600/90 text-white"
                  : executionStatus && executionStatus !== "Ditutup"
                    ? "bg-blue-600/90 text-white"
                    : "bg-gray-800/80 text-white"
              }`}>
                {executionStatus || "Ditutup"}
              </span>
            )}
          </div>
          {popularityLabel && (
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500 text-white text-[11px] font-semibold shadow-sm">
              🔥 {popularityLabel}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 flex-1 flex flex-col gap-2">
          {/* Category + Price */}
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${categoryColorClass}`}>
              {event.category}
            </span>
            {showPrice && (
              <span className={`text-[11px] font-bold ${event.price === 0 ? "text-green-600" : "text-gray-700"}`}>
                {priceDisplay}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition line-clamp-2 leading-snug">
            {event.title}
          </h3>

          {/* Organizer */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="truncate">{event.organizer}</span>
          </div>

          {/* Date & Deadline */}
          <div className="flex flex-col gap-1 mt-auto">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{formattedDate}</span>
            </div>
            {event.registrationDeadline && (
              <div className="flex items-center gap-1.5 text-xs">
                <svg className="w-3.5 h-3.5 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth="2"/>
                  <path d="M12 7v5l3 3" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="text-orange-600 font-semibold">
                  Deadline {new Date(`${event.registrationDeadline}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {lifecycle.deadlineDays !== null && lifecycle.deadlineDays > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold shrink-0">
                    {lifecycle.deadlineDays} hari lagi
                  </span>
                )}
                {lifecycle.deadlineDays === 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                    Hari Terakhir
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Footer */}
      <div className="px-3.5 pb-3.5">
        <Link
          href={`/event/${event.id}`}
          className="block w-full py-2 text-center text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
          aria-label={`Detail event ${event.title}`}
        >
          Lihat Detail
        </Link>
      </div>
    </div>
  );
}
