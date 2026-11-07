"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGetInformationById } from "@/lib/api";
import type { Information } from "@/types";

export default function InformationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<Information | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    params.then(({ id }) => apiGetInformationById(id).then(setItem).catch((e) => setError(e instanceof Error ? e.message : "Informasi tidak ditemukan.")));
  }, [params]);
  if (error) return <main className="p-12 text-center text-red-600">{error}</main>;
  if (!item) return <main className="p-12 text-center text-[#6F7580]">Memuat informasi...</main>;
  return <main className="max-w-3xl w-full mx-auto px-6 py-12"><Link href="/informasi" className="text-sm text-[#315E9E] hover:underline">← Kembali ke informasi</Link><article className="mt-6 bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl p-6 sm:p-8"><span className="text-xs font-bold uppercase text-[#315E9E]">{item.category}</span><h1 className="mt-3 text-3xl font-extrabold text-[#29374A]">{item.title}</h1><p className="mt-2 text-sm text-[#6F7580]">{item.institution || item.organizer}</p><div className="mt-8 whitespace-pre-wrap text-[#29374A] leading-7">{item.description}</div></article></main>;
}
