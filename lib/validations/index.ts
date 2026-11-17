import { z } from "zod";

/**
 * Format error Zod menjadi pesan ringkas dalam Bahasa Indonesia
 */
export function formatZodError(error: z.ZodError): string {
  if (!error.issues || error.issues.length === 0) return "Validasi input gagal.";
  return error.issues.map((issue) => issue.message).join(". ");
}

/**
 * Schema Autentikasi: Login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Format email tidak valid." }),
  password: z
    .string()
    .min(1, { message: "Kata sandi wajib diisi." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema Autentikasi: Registrasi
 */
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Nama lengkap minimal 2 karakter." })
    .max(150, { message: "Nama lengkap maksimal 150 karakter." }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Format email tidak valid." }),
  university: z
    .string()
    .trim()
    .min(2, { message: "Nama universitas/instansi wajib diisi." })
    .max(255, { message: "Nama universitas maksimal 255 karakter." }),
  password: z
    .string()
    .min(8, { message: "Kata sandi minimal 8 karakter." })
    .max(128, { message: "Kata sandi maksimal 128 karakter." }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Schema Profil Pengguna: Update
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Nama lengkap minimal 2 karakter." })
    .max(150, { message: "Nama lengkap maksimal 150 karakter." })
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Format email tidak valid." })
    .optional(),
  university: z
    .string()
    .trim()
    .max(255)
    .nullable()
    .optional(),
  avatarUrl: z
    .string()
    .trim()
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Schema Pembuatan Event
 */
export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Judul event minimal 3 karakter." })
    .max(255, { message: "Judul event maksimal 255 karakter." }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Deskripsi event minimal 10 karakter." }),
  category: z
    .string()
    .trim()
    .min(1, { message: "Kategori event wajib diisi." }),
  date: z
    .string()
    .trim()
    .min(1, { message: "Tanggal event wajib diisi." }),
  durationDays: z
    .number()
    .int()
    .min(1, { message: "Durasi event minimal 1 hari." })
    .default(1),
  time: z.string().trim().optional(),
  location: z
    .string()
    .trim()
    .min(1, { message: "Lokasi event wajib diisi." }),
  eventMode: z.enum(["offline", "online", "hybrid"]).default("offline"),
  image: z
    .string()
    .trim()
    .min(1, { message: "Poster event wajib diisi." }),
  price: z
    .number()
    .min(0, { message: "Harga event harus berupa angka positif atau 0 (gratis)." })
    .default(0),
  organizer: z
    .string()
    .trim()
    .min(1, { message: "Penyelenggara event wajib diisi." }),
  quota: z
    .number()
    .min(0, { message: "Kuota event harus berupa angka lebih besar atau sama dengan 0." })
    .default(100),
  organizerType: z.string().trim().optional(),
  institution: z.string().trim().optional(),
  organizerContact: z.string().trim().optional(),
  registrationDeadline: z.string().trim().optional(),
  registrationUrl: z.string().trim().optional(),
  descriptionBlocks: z.array(z.any()).max(10, { message: "Maksimal 10 blok konten." }).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  purpose: z.string().optional(),
  targetParticipants: z.string().optional(),
  speakers: z.string().optional(),
  facilities: z.array(z.string()).optional(),
  contactPic: z.string().trim().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

/**
 * Schema Update Event
 */
export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["active", "pending_review", "needs_revision", "rejected", "completed", "cancelled"]).optional(),
  rejectionReason: z.string().optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

/**
 * Schema Registrasi Tiket
 */
export const registerTicketSchema = z.object({
  action: z.literal("register", { message: "Action harus berupa 'register'." }),
});

/**
 * Schema Wishlist
 */
export const wishlistActionSchema = z.object({
  eventId: z.string().trim().min(1, { message: "Event ID wajib diisi." }),
  action: z.enum(["toggle", "add", "remove"]).optional().default("toggle"),
});

/**
 * Schema Preferensi Notifikasi
 */
export const notificationPreferencesSchema = z.object({
  reminderEvent: z.boolean().optional(),
  updateEvent: z.boolean().optional(),
  generalInfo: z.boolean().optional(),
  eventReminders: z.record(z.string(), z.string().nullable()).optional(),
});
