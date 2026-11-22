"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface EventLocationValue {
  latitude: number;
  longitude: number;
}

const DEFAULT_CENTER: [number, number] = [-0.950505, 100.353183];

const markerIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border:3px solid white;border-radius:50%;background:#315E9E;box-shadow:0 2px 8px rgba(41,55,74,.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/**
 * Peta pemilih titik lokasi.
 *
 * Peta dikelola langsung dengan Leaflet di dalam satu useEffect yang membuat dan
 * melepas instance-nya sendiri. react-leaflet tidak dipakai di sini karena
 * <MapContainer> membuat peta pada ref callback tetapi melepasnya di effect,
 * sehingga saat React menjalankan effect dua kali (StrictMode) atau memakai ulang
 * node saat navigasi client-side, peta sudah dilepas lebih dulu dan <TileLayer>
 * gagal dengan "Cannot read properties of undefined (reading 'appendChild')".
 */
export default function EventLocationPicker({
  latitude,
  longitude,
  onChange,
}: EventLocationValue & { onChange: (value: EventLocationValue) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const hasPosition = Boolean(latitude && longitude);
    const map = L.map(container, {
      center: hasPosition ? [latitude, longitude] : DEFAULT_CENTER,
      zoom: hasPosition ? 16 : 13,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      onChangeRef.current({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    });

    // Peta baru dipasang setelah elemennya punya ukuran, jadi ukurannya perlu
    // dihitung ulang satu kali setelah browser selesai melakukan layout.
    const frame = window.requestAnimationFrame(() => {
      if (mapRef.current === map) map.invalidateSize();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      map.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Peta hanya dipasang sekali per node; pergeseran titik ditangani effect di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !latitude || !longitude) return;

    if (!markerRef.current) {
      markerRef.current = L.marker([latitude, longitude], { icon: markerIcon }).addTo(map);
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
    }
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Peta titik lokasi event"
      className="h-64 w-full rounded-lg border border-[#E4DCCF] bg-[#F7F4EE]"
    />
  );
}