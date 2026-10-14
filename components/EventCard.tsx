import Image from "next/image";
import Link from "next/link";
import { Event } from "@/types";

interface EventCardProps {
  event: Event;
  showPrice?: boolean;
}

export default function EventCard({ event, showPrice = true }: EventCardProps) {
  // Format price display
  const priceDisplay =
    event.price === 0
      ? "Gratis"
      : `Rp ${event.price.toLocaleString("id-ID")}`;

  // Format date display
  const formattedDate = new Date(event.date).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group bg-white border border-gray-300 rounded-lg overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-gray-400 transition-all duration-200">
      <Link href={`/event/${event.id}`} className="block flex-1 flex flex-col">
        {/* Poster Image with next/image */}
        <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {showPrice && (
            <span
              className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs ${
                event.price === 0
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-900 text-white"
              }`}
            >
              {priceDisplay}
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {event.category}
            </span>
            {event.isPopular && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                🔥 Populer
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-2 leading-snug">
            {event.title}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-2 mt-auto">
            {event.description}
          </p>
        </div>
      </Link>

      {/* Card Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs bg-gray-50/50">
        <div className="flex flex-col">
          <span className="font-medium text-gray-700">{formattedDate}</span>
          <span className="text-gray-400 truncate max-w-[180px] sm:max-w-[200px]">
            {event.organizer}
          </span>
        </div>

        <Link
          href={`/event/${event.id}`}
          className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 flex items-center gap-1 hover:underline"
          aria-label={`Detail event ${event.title}`}
        >
          <span>Detail</span>
          <svg className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
