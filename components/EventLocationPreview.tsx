"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border:3px solid white;border-radius:50%;background:#315E9E;box-shadow:0 2px 8px rgba(41,55,74,.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function EventLocationPreview({
  latitude,
  longitude,
  location,
}: {
  latitude: number;
  longitude: number;
  location: string;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = mapRef.current;
    if (!container || mapInstanceRef.current) return;

    const instance = L.map(container, {
      center: [latitude, longitude],
      zoom: 16,
      scrollWheelZoom: false,
    });

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    ).addTo(instance);

    L.marker([latitude, longitude], { icon: markerIcon }).addTo(instance);

    mapInstanceRef.current = instance;

    return () => {
      instance.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude]);

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={mapRef}
        className="h-72 w-full rounded-xl border border-gray-200 bg-gray-100 animate-pulse"
      />
      <p className="text-xs text-gray-500">{location}</p>
    </div>
  );
}
