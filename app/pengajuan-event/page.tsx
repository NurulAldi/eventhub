"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { apiCreateEvent, apiGetEventById, apiUpdateEvent } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { DescriptionBlock } from "@/types";
import { saveSubmittedEvent } from "@/lib/submissions";

const EventLocationPicker = dynamic(() => import("@/components/EventLocationPicker"), {
  ssr: false,
  loading: () => <div className="h-64 w-full rounded-lg border border-[#E4DCCF] bg-[#F7F4EE]" />,
});

const categories = ["Seminar", "Workshop", "Lomba", "Beasiswa", "Konser & Musik", "Olahraga", "Technopreneurship"];
const organizerTypes = ["Individu", "Organisasi mahasiswa", "Unit kampus", "Perusahaan", "Komunitas"];
const participantTargets = [
  "Mahasiswa umum",
  "Mahasiswa fakultas tertentu",
  "Mahasiswa program studi tertentu",
  "Pelajar dan mahasiswa",
  "Umum",
];
const hourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const minuteOptions = ["00", "15", "30", "45"];
const makeBlock = (type: DescriptionBlock["type"] = "paragraph", id = `block-${type}`): DescriptionBlock => ({
  id,
  type,
  content: "",
});
const parseList = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value;
  return value ? value.split("\n").map((item) => item.trim()).filter(Boolean) : [];
};
const parseTimeRange = (value: string | undefined): [string, string] => {
  const match = (value || "").match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  return match ? [match[1], match[2]] : ["", ""];
};
// Nilai yang tidak tersedia pada data lama ditampilkan sebagai kolom kosong,
// bukan mengambil opsi pertama pada <select>.
const withCurrentOption = (options: string[], value: string) =>
  value && !options.includes(value) ? [value, ...options] : options;

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/uploads", { method: "POST", body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Upload gambar gagal.");
  return result.url;
}

function ImageUploadField({
  value,
  onChange,
  onFileSelect,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onFileSelect?: (file: File | undefined) => void;
  className?: string;
}) {
  const [selectedFile, setSelectedFile] = useState<File>();
  const previewUrl = useMemo(() => selectedFile ? URL.createObjectURL(selectedFile) : "", [selectedFile]);

  useEffect(() => {
    if (previewUrl) return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectFile = (file: File) => {
    setSelectedFile(file);
    onChange("");
    onFileSelect?.(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) selectFile(file);
  };

  const preview = previewUrl || value;

  return (
    <div className={className}>
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-[#D7E1EF] bg-[#F7F4EE] p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Pratinjau gambar yang dipilih" className="max-h-64 w-full rounded-lg object-cover" />
          <button
            type="button"
            aria-label="Hapus gambar"
            title="Hapus gambar"
            onClick={() => {
              setSelectedFile(undefined);
              onChange("");
              onFileSelect?.(undefined);
            }}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-xl font-bold leading-none text-white shadow-lg transition hover:bg-red-700"
          >
            ×
          </button>
        </div>
      ) : (
        <label
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#B8C9E0] bg-[#F7F4EE] px-4 py-6 text-center transition hover:border-[#315E9E] hover:bg-[#F1F5FB]"
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) selectFile(file);
              event.target.value = "";
            }}
          />
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#E5EDF8] text-xl text-[#315E9E]">↑</span>
          <span className="text-sm font-bold text-[#29374A]">Pilih gambar atau drag & drop di sini</span>
          <span className="mt-1 text-xs text-[#6F7580]">JPG, PNG, WEBP, GIF maksimal 5 MB</span>
        </label>
      )}
    </div>
  );
}

const createInitialForm = (organizer = "") => ({
  organizer,
  organizerType: "Organisasi mahasiswa",
  institution: "",
  title: "",
  category: "Seminar",
  eventMode: "offline" as "online" | "offline" | "hybrid",
  description: "",
  image: "",
  descriptionBlocks: [makeBlock()],
  purpose: "",
  targetParticipants: "Mahasiswa umum",
  speakers: "",
  date: "",
  durationDays: "1",
  time: "",
  startHour: "",
  startMinute: "",
  endTime: "",
  endHour: "",
  endMinute: "",
  registrationDeadline: "",
  location: "",
  latitude: null as number | null,
  longitude: null as number | null,
  quota: "100",
  price: "0",
  facilities: [] as string[],
  requirements: [] as string[],
  contactPic: "",
});
const initialForm = createInitialForm();

export default function EventSubmissionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<ReturnType<typeof createInitialForm>>(() => createInitialForm(user?.name));
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  // ID event yang datanya akan diedit, agar form tidak dirender dengan nilai
  // default sebelum data event selesai dimuat.
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File>();
  const [pendingDescriptionFiles, setPendingDescriptionFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const eventId = new URLSearchParams(window.location.search).get("edit");
      if (!eventId) return;
      setEditTargetId(eventId);
      void apiGetEventById(eventId).then((event) => {
        if (event.status === "rejected") {
          setError("Pengajuan event yang ditolak tidak dapat diedit.");
          return;
        }
        if (!event.image) {
          setError("Event ini belum memiliki sampul. Unggah sampul baru sebelum menyimpan perubahan.");
        }
        const [startTime = "", endTime = ""] = parseTimeRange(event.time);
        const [startHour = "", startMinute = ""] = startTime.split(":");
        const [endHour = "", endMinute = ""] = endTime.split(":");
        // Form diisi utuh dari data event lalu dipasang sekali, agar peta tidak
        // pernah dirender dengan nilai default atau dirender ulang saat mode/titik berubah.
        setForm({
          ...initialForm,
          organizer: event.organizer,
          organizerType: event.organizerType || "",
          institution: event.institution || "",
          title: event.title,
          category: event.category,
          eventMode: event.eventMode || initialForm.eventMode,
          image: event.image || "",
          description: event.description,
          descriptionBlocks: event.descriptionBlocks?.length
            ? event.descriptionBlocks
            : [{ ...makeBlock("paragraph", "legacy-description"), content: event.description }],
          purpose: event.purpose || "",
          targetParticipants: event.targetParticipants || "",
          speakers: event.speakers || "",
          date: event.date,
          durationDays: String(event.durationDays ?? 1),
          time: startTime,
          startHour,
          startMinute,
          endTime,
          endHour,
          endMinute,
          registrationDeadline: event.registrationDeadline || "",
          location: event.location,
          latitude: event.latitude ?? null,
          longitude: event.longitude ?? null,
          quota: String(event.quota ?? 100),
          price: String(event.price ?? 0),
          facilities: parseList(event.facilities),
          requirements: event.requirements || [],
          contactPic: event.contactPic || "",
        });
        setEditingEventId(eventId);
      }).catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat pengajuan event.");
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const update = <K extends keyof typeof form>(field: K, value: typeof form[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const updateBlock = (id: string, changes: Partial<DescriptionBlock>) => {
    update("descriptionBlocks", form.descriptionBlocks.map((block) => block.id === id ? { ...block, ...changes } as DescriptionBlock : block));
  };
  const removeBlock = (id: string) => update("descriptionBlocks", form.descriptionBlocks.filter((block) => block.id !== id));
  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= form.descriptionBlocks.length) return;
    const blocks = [...form.descriptionBlocks];
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    update("descriptionBlocks", blocks);
  };
  const updateListItem = (field: "facilities" | "requirements", index: number, value: string) => {
    const values = [...form[field]];
    values[index] = value;
    update(field, values);
  };
  const addListItem = (field: "facilities" | "requirements") => update(field, [...form[field], ""]);
  const removeListItem = (field: "facilities" | "requirements", index: number) => update(field, form[field].filter((_, itemIndex) => itemIndex !== index));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const nextFieldErrors: Partial<Record<keyof typeof form, string>> = {};
    const requiredFields: Array<[keyof typeof form, string]> = [
      ["organizer", "Nama penyelenggara wajib diisi."],
      ["title", "Judul event wajib diisi."],
      ["targetParticipants", "Target peserta wajib dipilih."],
      ["date", "Tanggal pelaksanaan wajib diisi."],
      ["durationDays", "Durasi event wajib diisi."],
      ["eventMode", "Mode event wajib dipilih."],
      ["registrationDeadline", "Deadline pendaftaran wajib diisi."],
      ["time", "Waktu mulai wajib diisi."],
      ["endTime", "Waktu selesai wajib diisi."],
      ["contactPic", "Kontak panitia wajib diisi."],
    ];
    if (form.eventMode !== "online") {
      requiredFields.push(["location", "Lokasi event wajib diisi."]);
      if (form.latitude === null || form.longitude === null) {
        nextFieldErrors.latitude = "Titik lokasi pada peta wajib dipilih.";
      }
    }
    if (form.organizerType && form.organizerType !== "Individu") {
      requiredFields.splice(2, 0, ["institution", "Institusi/organisasi wajib diisi."]);
    }
    for (const [field, message] of requiredFields) {
      const value = form[field];
      if ((typeof value === "string" && !value.trim()) || (Array.isArray(value) && value.length === 0)) {
        nextFieldErrors[field] = message;
      }
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

    if (!form.image && !pendingImageFile) {
      nextFieldErrors.image = "Sampul/gambar utama event wajib diisi.";
      showValidationError(nextFieldErrors.image);
      return;
    }

    const textContent = form.descriptionBlocks.filter((block) => block.type !== "image").map((block) => block.content.trim()).join(" ");
    if (textContent.length < 30) {
      nextFieldErrors.description = "Isi deskripsi teks minimal 30 karakter.";
      showValidationError(nextFieldErrors.description);
      return;
    }
    if (form.image && !pendingImageFile) {
      try {
        new URL(form.image);
      } catch {
        nextFieldErrors.image = "Masukkan URL gambar yang valid.";
        showValidationError(nextFieldErrors.image);
        return;
      }
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
    if (![form.time, form.endTime].every((value) => /^\d{2}:\d{2}$/.test(value) && minuteOptions.includes(value.slice(3)))) {
      nextFieldErrors.time = "Pilih jam dan menit mulai yang valid.";
      nextFieldErrors.endTime = "Pilih jam dan menit selesai yang valid.";
      showValidationError("Waktu harus menggunakan format 24 jam dengan interval 15 menit.");
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
    setIsSubmitting(true);
    try {
      const imageUrl = pendingImageFile ? await uploadImage(pendingImageFile) : form.image.trim();
      const descriptionBlocks = await Promise.all(
        form.descriptionBlocks
          .filter((block) => block.content.trim() || pendingDescriptionFiles[block.id])
          .map(async (block) => {
            const file = pendingDescriptionFiles[block.id];
            return file ? { ...block, content: await uploadImage(file) } : block;
          })
      );
      const payload: Parameters<typeof apiCreateEvent>[0] = {
        title: form.title,
        description: textContent,
        descriptionBlocks,
        image: imageUrl,
        date: form.date,
        durationDays: Number(form.durationDays),
        time: `${form.time} - ${form.endTime}`,
        location: form.eventMode === "online" ? "Online" : form.location,
        latitude: form.eventMode === "online" ? undefined : form.latitude ?? undefined,
        longitude: form.eventMode === "online" ? undefined : form.longitude ?? undefined,
        eventMode: form.eventMode,
        category: form.category,
        price: Number(form.price),
        organizer: form.organizer,
        quota: Number(form.quota),
        organizerType: form.organizerType,
        institution: form.organizerType === "Individu" ? "" : form.institution.trim(),
        registrationDeadline: form.registrationDeadline,
        purpose: form.purpose,
        targetParticipants: form.targetParticipants,
        speakers: form.speakers,
        facilities: form.facilities.map((item) => item.trim()).filter(Boolean),
        requirements: form.requirements.map((item) => item.trim()).filter(Boolean),
        contactPic: form.contactPic,
      };
      const submittedEvent = editingEventId
        ? await apiUpdateEvent(editingEventId, payload)
        : await apiCreateEvent(payload);
      if (user?.id) saveSubmittedEvent(user.id, submittedEvent);
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
        <p className="mt-2 text-sm text-[#6F7580]">Silakan masuk sebagai mahasiswa untuk mengajukan event.</p>
        <button type="button" onClick={() => router.push("/login")} className="mt-5 px-4 py-2 bg-[#315E9E] text-white rounded-md text-sm">
          Masuk Akun
        </button>
      </div>
    );
  }

  if (editTargetId && !editingEventId) {
    return (
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 lg:px-16 py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29374A]">Perbaiki Pengajuan Event</h1>
        {error ? (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        ) : (
          <p className="mt-2 text-sm text-[#6F7580]">Memuat data pengajuan event...</p>
        )}
      </main>
    );
  }

  const fieldClass = "w-full px-3 py-2 bg-[#F7F4EE] border border-[#E4DCCF] rounded-md text-sm focus:bg-[#FFFCF6] focus:outline-none focus:border-[#315E9E]";
  const getFieldClass = (field: keyof typeof form) =>
    `${fieldClass} ${fieldErrors[field] ? "border-red-500 bg-red-50 focus:border-red-600" : ""}`;
  const requiredLabel = (label: string) => <span className="text-xs font-bold text-[#29374A]">{label} *</span>;

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-6 lg:px-16 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29374A]">
          {editingEventId ? "Perbaiki Pengajuan Event" : "Pengajuan Event"}
        </h1>
        <p className="mt-2 text-sm text-[#6F7580]">
          {editingEventId
            ? "Perbarui informasi event Anda. Event yang sudah aktif tetap tampil setelah perubahan disimpan."
            : "Lengkapi informasi berikut. Pengajuan akan berstatus Menunggu Review sampai disetujui admin."}
        </p>
      </div>
      {error && (
        <div role="alert" className="fixed top-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate className="bg-[#FFFCF6] border border-[#E4DCCF] rounded-xl p-6 sm:p-8 flex flex-col gap-7">
        <section className="flex flex-col gap-3">
          <h2 className="font-bold text-[#29374A] border-b border-[#E4DCCF] pb-2">Sampul Event</h2>
          <span>{requiredLabel("Sampul/gambar utama event")}</span>
          <p className="text-xs text-[#6F7580]">Gunakan satu gambar terbaik sebagai identitas event. Gambar baru hanya disimpan setelah Anda menekan tombol kirim.</p>
          <ImageUploadField
            value={form.image}
            onChange={(value) => update("image", value)}
            onFileSelect={setPendingImageFile}
          />
          {fieldErrors.image && <span className="text-xs text-red-600">{fieldErrors.image}</span>}
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="font-bold text-[#29374A] border-b border-[#E4DCCF] pb-2">Identitas Penyelenggara</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">{requiredLabel("Nama penyelenggara")}<input required value={form.organizer} onChange={(e) => update("organizer", e.target.value)} className={getFieldClass("organizer")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Jenis penyelenggara")}<select required value={form.organizerType} onChange={(e) => { const value = e.target.value; update("organizerType", value); if (value === "Individu") update("institution", ""); }} className={fieldClass}>{!organizerTypes.includes(form.organizerType) && <option value={form.organizerType} disabled>{form.organizerType || "Pilih jenis penyelenggara"}</option>}{organizerTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            {form.organizerType && form.organizerType !== "Individu" && (
              <label className="flex flex-col gap-1">{requiredLabel("Institusi/organisasi")}<input required value={form.institution} onChange={(e) => update("institution", e.target.value)} className={getFieldClass("institution")} /></label>
            )}
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="font-bold text-[#29374A] border-b border-[#E4DCCF] pb-2">Informasi Event</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="sm:col-span-2 flex flex-col gap-1">{requiredLabel("Judul event")}<input required minLength={3} value={form.title} onChange={(e) => update("title", e.target.value)} className={getFieldClass("title")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Kategori")}<select required value={form.category} onChange={(e) => update("category", e.target.value)} className={fieldClass}>{withCurrentOption(categories, form.category).map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="flex flex-col gap-1">{requiredLabel("Mode event")}<select required value={form.eventMode} onChange={(e) => { const mode = e.target.value as "online" | "offline" | "hybrid"; update("eventMode", mode); if (mode === "online") { update("location", "Online"); update("latitude", null); update("longitude", null); } else if (form.location === "Online") update("location", ""); }} className={getFieldClass("eventMode")}><option value="offline">Offline</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></label>
            <label className="flex flex-col gap-1">{requiredLabel("Target peserta")}<select required value={form.targetParticipants} onChange={(e) => update("targetParticipants", e.target.value)} className={getFieldClass("targetParticipants")}>{withCurrentOption(participantTargets, form.targetParticipants).map((target) => <option key={target} value={target} disabled={!target}>{target || "Pilih target peserta"}</option>)}</select></label>
            <div className="sm:col-span-2 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  {requiredLabel("Deskripsi lengkap")}
                  <p className="mt-1 text-xs font-normal text-[#6F7580]">Susun informasi event dengan judul, paragraf, dan gambar pendukung.</p>
                </div>
                <span className="rounded-full bg-[#E5EDF8] px-3 py-1 text-xs font-bold text-[#315E9E]">{form.descriptionBlocks.length}/10 blok</span>
              </div>
              <div className="rounded-xl border border-[#D7E1EF] bg-[#F8FAFD] p-3 sm:p-4">
                <div className="mb-3 border-b border-[#D7E1EF] pb-3">
                  <button
                    type="button"
                    disabled={form.descriptionBlocks.length >= 10}
                    onClick={() => update("descriptionBlocks", [...form.descriptionBlocks, makeBlock("paragraph", `block-${Date.now()}`)])}
                    className="rounded-lg border border-[#B8C9E0] bg-white px-4 py-2 text-xs font-bold text-[#315E9E] transition hover:border-[#315E9E] hover:bg-[#E5EDF8] disabled:opacity-40"
                  >
                    + Tambah Blok Konten
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                {form.descriptionBlocks.map((block, index) => (
                  <div key={block.id} className="rounded-xl border border-[#E4DCCF] bg-white p-3 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <select aria-label="Jenis blok deskripsi" value={block.type} onChange={(e) => updateBlock(block.id, { type: e.target.value as DescriptionBlock["type"] })} className="rounded-lg border border-[#E4DCCF] bg-[#F7F4EE] px-3 py-2 text-xs font-bold text-[#29374A]">
                        <option value="paragraph">Paragraf</option>
                        <option value="heading1">Heading 1</option>
                        <option value="heading2">Heading 2</option>
                        <option value="heading3">Heading 3</option>
                        <option value="image">Gambar</option>
                      </select>
                      <div className="flex gap-1">
                        <button type="button" aria-label="Pindahkan blok ke atas" title="Pindahkan ke atas" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4DCCF] text-lg leading-none text-[#6F7580] disabled:cursor-not-allowed disabled:opacity-40">↑</button>
                        <button type="button" aria-label="Pindahkan blok ke bawah" title="Pindahkan ke bawah" onClick={() => moveBlock(index, 1)} disabled={index === form.descriptionBlocks.length - 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4DCCF] text-lg leading-none text-[#6F7580] disabled:cursor-not-allowed disabled:opacity-40">↓</button>
                        <button type="button" aria-label="Hapus blok" title="Hapus blok" onClick={() => removeBlock(block.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7l1-3h4l1 3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {block.type === "image" ? (
                      <ImageUploadField
                        value={block.content}
                        onChange={(value) => updateBlock(block.id, { content: value })}
                        onFileSelect={(file) => setPendingDescriptionFiles((current) => {
                          const next = { ...current };
                          if (file) next[block.id] = file;
                          else delete next[block.id];
                          return next;
                        })}
                      />
                    ) : (
                      <textarea rows={block.type === "paragraph" ? 4 : 2} value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} placeholder={block.type === "paragraph" ? "Jelaskan rangkaian, manfaat, atau informasi penting event..." : "Tulis judul bagian..."} className={`${fieldClass} resize-y`} />
                    )}
                  </div>
                ))}
                </div>
              </div>
              {fieldErrors.description && <span className="text-xs text-red-600">{fieldErrors.description}</span>}
            </div>
            <label className="flex flex-col gap-1"><span className="text-xs font-bold text-[#29374A]">Tujuan event</span><textarea rows={3} value={form.purpose} onChange={(e) => update("purpose", e.target.value)} className={fieldClass} /></label>
            <label className="flex flex-col gap-1"><span className="text-xs font-bold text-[#29374A]">Narasumber/juri</span><textarea rows={3} value={form.speakers} onChange={(e) => update("speakers", e.target.value)} className={fieldClass} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Tanggal pelaksanaan")}<input required type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={getFieldClass("date")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Durasi pelaksanaan (hari)")}<input required type="number" min="1" step="1" value={form.durationDays} onChange={(e) => update("durationDays", e.target.value)} className={getFieldClass("durationDays")} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Deadline pendaftaran")}<input required type="date" value={form.registrationDeadline} onChange={(e) => update("registrationDeadline", e.target.value)} className={getFieldClass("registrationDeadline")} /></label>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium">{requiredLabel("Waktu mulai")}</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  required
                  aria-label="Jam mulai"
                  value={form.startHour}
                  onChange={(e) => {
                    const startHour = e.target.value;
                    update("startHour", startHour);
                    update("time", startHour && form.startMinute ? `${startHour}:${form.startMinute}` : "");
                  }}
                  className={getFieldClass("time")}
                >
                  <option value="">Jam</option>
                  {hourOptions.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                </select>
                <select
                  required
                  aria-label="Menit mulai"
                  value={form.startMinute}
                  onChange={(e) => {
                    const startMinute = e.target.value;
                    update("startMinute", startMinute);
                    update("time", form.startHour && startMinute ? `${form.startHour}:${startMinute}` : "");
                  }}
                  className={getFieldClass("time")}
                >
                  <option value="">Menit</option>
                  {minuteOptions.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium">{requiredLabel("Waktu selesai")}</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  required
                  aria-label="Jam selesai"
                  value={form.endHour}
                  onChange={(e) => {
                    const endHour = e.target.value;
                    update("endHour", endHour);
                    update("endTime", endHour && form.endMinute ? `${endHour}:${form.endMinute}` : "");
                  }}
                  className={getFieldClass("endTime")}
                >
                  <option value="">Jam</option>
                  {hourOptions.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                </select>
                <select
                  required
                  aria-label="Menit selesai"
                  value={form.endMinute}
                  onChange={(e) => {
                    const endMinute = e.target.value;
                    update("endMinute", endMinute);
                    update("endTime", form.endHour && endMinute ? `${form.endHour}:${endMinute}` : "");
                  }}
                  className={getFieldClass("endTime")}
                >
                  <option value="">Menit</option>
                  {minuteOptions.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
                </select>
              </div>
            </div>
            <label className="flex flex-col gap-1">{requiredLabel("Lokasi event")}<input required={form.eventMode !== "online"} disabled={form.eventMode === "online"} value={form.eventMode === "online" ? "Online" : form.location} onChange={(e) => update("location", e.target.value)} placeholder="Gedung atau ruangan" className={`${getFieldClass("location")} disabled:cursor-not-allowed disabled:bg-[#EAE2D4] disabled:text-[#92959C]`} /></label>
            {form.eventMode !== "online" && (
              <div className="sm:col-span-2 flex flex-col gap-2">
                <div>
                  <span className="text-xs font-bold text-[#29374A]">Titik Lokasi pada Peta</span>
                  <p className="text-[11px] text-[#6F7580] mt-1">Klik lokasi event pada peta untuk menempatkan penanda.</p>
                </div>
                <EventLocationPicker
                  latitude={form.latitude ?? 0}
                  longitude={form.longitude ?? 0}
                  onChange={(value) => {
                    update("latitude", value.latitude);
                    update("longitude", value.longitude);
                  }}
                />
                {form.latitude !== null && form.longitude !== null && (
                  <p className="text-[11px] text-[#6F7580]">
                    Koordinat: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                  </p>
                )}
                {fieldErrors.latitude && (
                  <p className="text-xs text-red-600 font-medium">{fieldErrors.latitude}</p>
                )}
              </div>
            )}
            <label className="flex flex-col gap-1">{requiredLabel("Kapasitas peserta")}<input required type="number" min="1" value={form.quota} onChange={(e) => update("quota", e.target.value)} className={fieldClass} /></label>
            <label className="flex flex-col gap-1">{requiredLabel("Biaya pendaftaran")}<input required type="number" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} className={fieldClass} /></label>
            {(["facilities", "requirements"] as const).map((field) => (
              <div key={field} className="sm:col-span-2 flex flex-col gap-2">
                <span className="text-xs font-bold text-[#29374A]">{field === "facilities" ? "Fasilitas/hadiah" : "Syarat peserta"}</span>
                {form[field].map((item, index) => (
                  <div key={`${field}-${index}`} className="flex gap-2">
                    <input value={item} onChange={(e) => updateListItem(field, index, e.target.value)} placeholder={field === "facilities" ? "Contoh: E-sertifikat" : "Contoh: Mahasiswa aktif"} className={fieldClass} />
                    <button type="button" onClick={() => removeListItem(field, index)} className="rounded-md border border-red-200 px-3 text-xs text-red-600">Hapus</button>
                  </div>
                ))}
                <button type="button" onClick={() => addListItem(field)} className="self-start rounded-md border border-[#315E9E] px-3 py-2 text-xs font-bold text-[#315E9E]">+ Tambah {field === "facilities" ? "fasilitas/hadiah" : "syarat"}</button>
              </div>
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="font-bold text-[#29374A] border-b border-[#E4DCCF] pb-2">Kontak Panitia</h2>
          <label className="flex flex-col gap-1">{requiredLabel("Kontak panitia")}<input required value={form.contactPic} onChange={(e) => update("contactPic", e.target.value)} className={getFieldClass("contactPic")} /></label>
        </section>
        <div className="flex justify-end gap-3 border-t border-[#E4DCCF] pt-5">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-[#E4DCCF] rounded-md text-sm">Batal</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#315E9E] text-white rounded-md text-sm font-bold disabled:opacity-50">{isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}</button>
        </div>
      </form>
    </main>
  );
}
