"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import InformationCard from "@/components/InformationCard";
import { apiGetInformation } from "@/lib/api";
import type { Information } from "@/types";

export default function InformationPage() {
  const [items, setItems] = useState<Information[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    apiGetInformation({ search }).then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat informasi."));
  }, [search]);
  return (
    <main className="max-w-7xl w-full mx-auto px-6 lg:px-16 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div><h1 className="text-3xl font-extrabold text-[#29374A]">Informasi Kampus</h1><p className="mt-1 text-sm text-[#6F7580]">Pusat informasi dan pengumuman mahasiswa.</p></div>
        <Link href="/pengajuan-informasi" className="px-4 py-2 bg-[#E98268] text-white rounded-md text-sm font-semibold text-center">Ajukan Informasi</Link>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari informasi..." className="w-full mb-6 px-4 py-3 bg-[#FFFCF6] border border-[#E4DCCF] rounded-lg text-sm outline-none focus:border-[#315E9E]" />
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{items.map((item) => <InformationCard key={item.id} item={item} />)}</div>
      {!items.length && !error && <p className="text-sm text-[#6F7580]">Belum ada informasi yang dipublikasikan.</p>}
    </main>
  );
}
