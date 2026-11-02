"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCreateEvent } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const categories = ["Seminar", "Workshop", "Lomba", "Beasiswa", "Konser & Musik", "Olahraga"];
const organizerTypes = ["Individu", "Organisasi mahasiswa", "Unit kampus", "Perusahaan", "Komunitas"];
const participantTargets = [
  "Mahasiswa umum",
  "Mahasiswa fakultas tertentu",
  "Mahasiswa program studi tertentu",
  "Pelajar dan mahasiswa",
  "Umum",
];

export default function EventSubmissionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({
    organizer: user?.name || "",
    organizerType: "Organisasi mahasiswa",
    organizerContact: "",
    institution: "",
    title: "",
    category: "Seminar",
    eventMode: "offline" as "online" | "offline",
    description: "",
    purpose: "",
    targetParticipants: "Mahasiswa umum",
    speakers: "",
    date: "",
    durationDays: "1",
    time: "",
    endTime: "",
    registrationDeadline: "",
    location: "",
    registrationUrl: "",
    quota: "100",
    price: "0",
    facilities: "",
    requirements: "",
    contactPic: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = <K extends keyof typeof form>(field: K, value: typeof form[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const nextFieldErrors: Partial<Record<keyof typeof form, string>> = {};
    const requiredFields: Array<[keyof typeof form, string]> = [
      ["organizer", "Nama penyelenggara wajib diisi."],
      ["organizerContact", "Nomor WhatsApp wajib diisi."],
      ["institution", "Institusi/organisasi wajib diisi."],
      ["title", "Judul event wajib diisi."],
      ["targetParticipants", "Target peserta wajib dipilih."],
      ["description", "Deskripsi event wajib diisi."],
      ["date", "Tanggal pelaksanaan wajib diisi."],
      ["durationDays", "Durasi event wajib diisi."],
      ["eventMode", "Mode event wajib dipilih."],
      ["registrationDeadline", "Deadline pendaftaran wajib diisi."],
      ["time", "Waktu mulai wajib diisi."],
      ["endTime", "Waktu selesai wajib diisi."],
      ["location", "Lokasi atau link online wajib diisi."],
      ["registrationUrl", "Link pendaftaran wajib diisi."],
      ["contactPic", "Kontak panitia wajib diisi."],
    ];
    for (const [field, message] of requiredFields) {
      if (!form[field].trim()) nextFieldErrors[field] = message;
    }

    const showValidationError = (message: string) => {
      setFieldErrors(nextFieldErrors);
      setError(message);
      window.setTimeout(() => setError(""), 5000);
    };

    if (Object.keys(nextFieldErrors).length > 0) {
      showValidationError("Mohon periksa kembali kolom yang ditandai merah.");
      return;
    }

    if (form.description.trim().length < 30) {
      nextFieldErrors.description = "Deskripsi event minimal 30 karakter.";
      showValidationError(nextFieldErrors.description);
      return;
    }
    if (form.registrationDeadline >= form.date) {
      nextFieldErrors.registrationDeadline = "Deadline harus sebelum tanggal pelaksanaan.";
      nextFieldErrors.date = "Tanggal harus setelah deadline pendaftaran.";
      showValidationError("Deadline pendaftaran harus sebelum tanggal pelaksanaan.");
      return;
    }
    if (form.endTime <= form.time) {
      nextFieldErrors.endTime = "Waktu selesai harus setelah waktu mulai.";
      nextFieldErrors.time = "Waktu mulai harus sebelum waktu selesai.";
      showValidationError("Waktu selesai harus setelah waktu mulai.");
      return;
    }
    if (!Number.isInteger(Number(form.durationDays)) || Number(form.durationDays) < 1) {
      nextFieldErrors.durationDays = "Durasi event minimal 1 hari.";
      showValidationError(nextFieldErrors.durationDays);
      return;
    }
    if (new Date(`${form.date}T23:59:59`) < new Date()) {
      nextFieldErrors.date = "Tanggal event tidak boleh berada di masa lalu.";
      showValidationError(nextFieldErrors.date);
      return;
    }
    try {
      new URL(form.registrationUrl);
    } catch {
      nextFieldErrors.registrationUrl = "Masukkan URL yang valid.";
      showValidationError(nextFieldErrors.registrationUrl);
      return;
    }

    setIsSubmitting(true);
    try {
      const submittedEvent = await apiCreateEvent({
        title: form.title,
        description: form.description,
        date: form.date,
        durationDays: Number(form.durationDays),
        time: `${form.time} - ${form.endTime}`,
        location: form.location,
        eventMode: form.eventMode,
        category: form.category,
        price: Number(form.price),
        organizer: form.organizer,
        quota: Number(form.quota),
        status: "pending_review",
        organizerType: form.organizerType,
        organizerContact: form.organizerContact,
        registrationDeadline: form.registrationDeadline,
        registrationUrl: form.registrationUrl,
        purpose: form.purpose,
        targetParticipants: form.targetParticipants,
        speakers: form.speakers,
        facilities: form.facilities,
        requirements: form.requirements.split("\n").map((item) => item.trim()).filter(Boolean),
        contactPic: form.contactPic,
      });
      localStorage.setItem("eventhub_last_submission", JSON.stringify(submittedEvent));
      router.push("/profil?submission=success");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Pengajuan event gagal dikirim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== "user") {
    return (
      <div className="flex-1 p-12 text-center">
        <h1 className="text-xl font-bold">Akses Pengajuan Event</h1>
        <p className="mt-2 text-sm text-gray-500">Silakan masuk sebagai mahasiswa untuk mengajukan event.</p>
        <button type="button" onClick={() => router.push("/login")} className="mt-5 px-4 py-2 bg-gray-900 text-white rounded-md text-sm">
          Masuk Akun
        </button>
      </div>
    );
  }

  const fieldClass = "w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm focus:bg-white focus:outline-none focus:border-gray-900";
  const getFieldClass = (field: keyof typeof form) =>
    `${fieldClass} ${fieldErrors[field] ? "border-red-500 bg-red-50 focus:border-red-600" : ""}`;
  const requiredLabel = (label: string) => <span className="text-xs font-bold text-gray-700">{label} *</span>;

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-6 lg:px-16 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Pengajuan Event</h1>
        <p className="mt-2 text-sm text-gray-500">Lengkapi informasi berikut. Pengajuan akan berstatus Menunggu Review sampai disetujui admin.</p>
      </div>
      {error && (
        <div role="alert" className="fixed top-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate className="bg-white border border-gray-300 rounded-xl p-6 sm:p-8 flex flex-col gap-7">
        <section className="flex flex-col gap-4">
          <h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Identitas Penyelenggara</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">{requiredLabel("Nama penyelenggara")}<input required value={form.organizer} onChange={(e) => update("organizer", e.target.value)} className={getFieldClass("organizer")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Jenis penyelenggara")}<select required value={form.organizerType} onChange={(e) => update("organizerType", e.target.value)} className={fieldClass}>{organizerTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="flex flex-col gap-1">{requiredLabel("Nomor WhatsApp")}<input required value={form.organizerContact} onChange={(e) => update("organizerContact", e.target.value)} className={getFieldClass("organizerContact")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Institusi/organisasi")}<input required value={form.institution} onChange={(e) => update("institution", e.target.value)} className={getFieldClass("institution")} /></label>
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Informasi Event</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="sm:col-span-2 flex flex-col gap-1">{requiredLabel("Judul event")}<input required minLength={3} value={form.title} onChange={(e) => update("title", e.target.value)} className={getFieldClass("title")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Kategori")}<select required value={form.category} onChange={(e) => update("category", e.target.value)} className={fieldClass}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="flex flex-col gap-1">{requiredLabel("Mode event")}<select required value={form.eventMode} onChange={(e) => update("eventMode", e.target.value as "online" | "offline")} className={getFieldClass("eventMode")}><option value="offline">Offline</option><option value="online">Online</option></select></label>
            <label className="flex flex-col gap-1">{requiredLabel("Target peserta")}<select required value={form.targetParticipants} onChange={(e) => update("targetParticipants", e.target.value)} className={getFieldClass("targetParticipants")}>{participantTargets.map((target) => <option key={target}>{target}</option>)}</select></label>
            <label className="sm:col-span-2 flex flex-col gap-1">{requiredLabel("Deskripsi lengkap")}<textarea required minLength={30} rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={getFieldClass("description")} /></label>
            <label className="flex flex-col gap-1"><span className="text-xs font-bold text-gray-700">Tujuan event</span><textarea rows={3} value={form.purpose} onChange={(e) => update("purpose", e.target.value)} className={fieldClass} /></label>
            <label className="flex flex-col gap-1"><span className="text-xs font-bold text-gray-700">Narasumber/juri</span><textarea rows={3} value={form.speakers} onChange={(e) => update("speakers", e.target.value)} className={fieldClass} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Tanggal pelaksanaan")}<input required type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={getFieldClass("date")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Durasi pelaksanaan (hari)")}<input required type="number" min="1" step="1" value={form.durationDays} onChange={(e) => update("durationDays", e.target.value)} className={getFieldClass("durationDays")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Deadline pendaftaran")}<input required type="date" value={form.registrationDeadline} onChange={(e) => update("registrationDeadline", e.target.value)} className={getFieldClass("registrationDeadline")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Waktu mulai")}<input required type="time" value={form.time} onChange={(e) => update("time", e.target.value)} className={getFieldClass("time")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Waktu selesai")}<input required type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} className={getFieldClass("endTime")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel(form.eventMode === "online" ? "Link meeting online" : "Lokasi event")}<input required value={form.location} onChange={(e) => update("location", e.target.value)} placeholder={form.eventMode === "online" ? "https://..." : "Gedung atau ruangan"} className={getFieldClass("location")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Link pendaftaran")}<input required type="url" value={form.registrationUrl} onChange={(e) => update("registrationUrl", e.target.value)} className={getFieldClass("registrationUrl")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Kapasitas peserta")}<input required type="number" min="1" value={form.quota} onChange={(e) => update("quota", e.target.value)} className={fieldClass} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Biaya pendaftaran")}<input required type="number" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} className={fieldClass} /></label>
            <label className="sm:col-span-2 flex flex-col gap-1"><span className="text-xs font-bold text-gray-700">Fasilitas/hadiah</span><textarea rows={2} value={form.facilities} onChange={(e) => update("facilities", e.target.value)} className={fieldClass} /></label>
            <label className="sm:col-span-2 flex flex-col gap-1"><span className="text-xs font-bold text-gray-700">Syarat peserta</span><textarea rows={3} value={form.requirements} onChange={(e) => update("requirements", e.target.value)} placeholder="Satu syarat per baris" className={fieldClass} /></label>
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Kontak Panitia</h2>
          <label className="flex flex-col gap-1">{requiredLabel("Kontak panitia")}<input required value={form.contactPic} onChange={(e) => update("contactPic", e.target.value)} className={getFieldClass("contactPic")} /></label>
        </section>
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-md text-sm">Batal</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-gray-900 text-white rounded-md text-sm font-bold disabled:opacity-50">{isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}</button>
        </div>
      </form>
    </main>
  );
}
