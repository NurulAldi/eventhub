"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiCreateInformation, apiDeleteInformation, apiGetInformation, apiGetInformationById, apiUpdateInformation } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Information } from "@/types";

const categories = ["Akademik", "Beasiswa", "Layanan Kampus", "Organisasi", "Prestasi", "Umum"];

function InformationSubmissionContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [form, setForm] = useState({ title: "", description: "", category: categories[0], organizer: "", institution: "" });
  const [submitted, setSubmitted] = useState<Information[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!editId) return;
    apiGetInformationById(editId).then((item) => setForm({ title: item.title, description: item.description, category: item.category, organizer: item.organizer, institution: item.institution || "" })).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat informasi."));
  }, [editId]);
  useEffect(() => {
    if (user?.role === "user") {
      apiGetInformation({ authorEmail: user.email, role: "user" }).then(setSubmitted).catch(() => undefined);
    }

  }, [user]);
  if (!user || user.role !== "user") return <main className="p-12 text-center"><h1 className="text-xl font-bold">Akses Pengajuan Informasi</h1><p className="mt-2 text-sm text-[#6F7580]">Silakan masuk sebagai mahasiswa untuk mengajukan informasi.</p></main>;
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    try {
      const payload = { ...form, authorEmail: user.email };
      if (editId) await apiUpdateInformation(editId, payload, "user");
      else await apiCreateInformation(payload, "user");
      router.push("/informasi");
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan informasi."); }
  };
  const remove = async (item: Information) => {
    if (!confirm(`Hapus pengajuan "${item.title}"?`)) return;
    try {
      await apiDeleteInformation(item.id, "user", user.email);
      setSubmitted((current) => current.filter((entry) => entry.id !== item.id));
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus pengajuan."); }
  };
  const field = "w-full px-3 py-2 bg-[#F7F4EE] border border-[#E4DCCF] rounded-md text-sm outline-none focus:border-[#315E9E]";
  return <main className="max-w-3xl w-full mx-auto px-6 py-10"><h1 className="text-3xl font-extrabold text-[#29374A]">{editId ? "Perbaiki Informasi" : "Ajukan Informasi"}</h1><p className="mt-2 text-sm text-[#6F7580]">Informasi akan ditinjau admin sebelum dipublikasikan.</p>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<form onSubmit={submit} className="mt-6 bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl p-6 flex flex-col gap-4"><label className="text-xs font-bold">Judul<input required minLength={3} value={form.title} onChange={(e) => update("title", e.target.value)} className={field} /></label><label className="text-xs font-bold">Kategori<select value={form.category} onChange={(e) => update("category", e.target.value)} className={field}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="text-xs font-bold">Sumber informasi<input required value={form.organizer} onChange={(e) => update("organizer", e.target.value)} className={field} /></label><label className="text-xs font-bold">Institusi/organisasi<input value={form.institution} onChange={(e) => update("institution", e.target.value)} className={field} /></label><label className="text-xs font-bold">Isi informasi<textarea required minLength={10} rows={8} value={form.description} onChange={(e) => update("description", e.target.value)} className={field} /></label><button className="self-end px-5 py-2 bg-[#315E9E] text-white rounded-md text-sm font-semibold">{editId ? "Kirim Perubahan" : "Kirim Pengajuan"}</button></form>{submitted.length > 0 && <section className="mt-8"><h2 className="font-bold text-[#29374A] mb-3">Pengajuan Saya</h2><div className="flex flex-col gap-2">{submitted.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 bg-[#FFFCF6] border border-[#E4DCCF] rounded-lg p-3 text-sm"><span className="font-semibold">{item.title} <small className="font-normal text-[#6F7580]">({item.status})</small></span><span className="flex gap-3"><button type="button" onClick={() => router.push(`/pengajuan-informasi?edit=${item.id}`)} className="text-[#315E9E] hover:underline">Edit</button><button type="button" onClick={() => remove(item)} className="text-red-600 hover:underline">Hapus</button></span></div>)}</div></section>}</main>;
}

export default function InformationSubmissionPage() {
  return (
    <Suspense fallback={<main className="p-12 text-center text-sm text-[#6F7580]">Memuat formulir informasi...</main>}>
      <InformationSubmissionContent />
    </Suspense>
  );
}
