"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiDeleteInformation, apiGetInformation, apiUpdateInformation } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Information } from "@/types";

const statuses: Array<{ value: Information["status"]; label: string }> = [
  { value: "pending_review", label: "Menunggu Review" },
  { value: "needs_revision", label: "Perlu Perbaikan" },
  { value: "published", label: "Dipublikasikan" },
  { value: "rejected", label: "Ditolak" },
];

export default function AdminInformationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Information[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (user?.role !== "admin") { router.replace("/"); return; }
    apiGetInformation({ status: "Semua", role: "admin" }).then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat informasi."));
  }, [router, user?.role]);
  if (user?.role !== "admin") return null;
  const updateStatus = async (item: Information, status: Information["status"]) => {
    try { const updated = await apiUpdateInformation(item.id, { status }, "admin"); setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry)); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memperbarui status."); }
  };
  const remove = async (item: Information) => {
    if (!confirm(`Hapus informasi "${item.title}"?`)) return;
    try { await apiDeleteInformation(item.id, "admin"); setItems((current) => current.filter((entry) => entry.id !== item.id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus informasi."); }
  };
  return <main className="flex-1 p-6 md:p-12 bg-[#F7F4EE]"><div className="flex items-start justify-between gap-4 mb-8"><div><h1 className="text-3xl font-extrabold text-[#29374A]">Kelola Informasi</h1><p className="mt-1 text-sm text-[#6F7580]">Terima ajuan, pantau status, dan kelola informasi mahasiswa.</p></div><Link href="/informasi" className="text-sm text-[#315E9E] hover:underline">Lihat publik</Link></div>{error && <p className="mb-4 text-sm text-red-600">{error}</p>}<div className="bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#F7F4EE] text-xs uppercase text-[#6F7580]"><tr><th className="p-4">Judul</th><th className="p-4">Kategori</th><th className="p-4">Pengaju</th><th className="p-4">Status</th><th className="p-4">Aksi</th></tr></thead><tbody className="divide-y divide-[#E4DCCF]">{items.map((item) => <tr key={item.id}><td className="p-4 font-semibold text-[#29374A]"><Link href={`/informasi/${item.id}`} className="hover:underline">{item.title}</Link></td><td className="p-4">{item.category}</td><td className="p-4">{item.organizer}</td><td className="p-4"><select value={item.status} onChange={(e) => updateStatus(item, e.target.value as Information["status"])} className="px-2 py-1 border border-[#E4DCCF] rounded text-xs">{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></td><td className="p-4"><button type="button" onClick={() => remove(item)} className="text-red-600 hover:underline text-xs font-semibold">Hapus</button></td></tr>)}</tbody></table>{!items.length && <p className="p-8 text-center text-sm text-[#6F7580]">Belum ada ajuan informasi.</p>}</div></main>;
}
