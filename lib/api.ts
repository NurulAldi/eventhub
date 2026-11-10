/**
 * Client API Layer for EventHub UNP
 * Menyediakan fungsi-fungsi konsisten untuk mengambil dan mengubah data melalui Backend REST API.
 */

import { AdminUser, DescriptionBlock, Event, EventCategory, EventStatus } from "@/types";

export interface EventQueryParams {
  category?: string;
  search?: string;
  price?: "semua" | "gratis" | "berbayar" | string;
  location?: "semua" | "online" | "offline" | string;
  status?: string;
  sortBy?: "terbaru" | "populer" | "deadline-terdekat" | "harga-rendah" | string;
}

export interface CreateEventPayload {
  id?: string;
  title: string;
  description: string;
  date: string;
  durationDays?: number;
  time?: string;
  location: string;
  eventMode?: "online" | "offline";
  category: EventCategory | string;
  image?: string;
  descriptionBlocks?: DescriptionBlock[];
  price?: number;
  organizer: string;
  quota?: number;
  registeredCount?: number;
  status?: EventStatus;
  requirements?: string[];
  contactPic?: string;
  isPopular?: boolean;
  organizerType?: string;
  institution?: string;
  organizerContact?: string;
  registrationDeadline?: string;
  registrationUrl?: string;
  purpose?: string;
  targetParticipants?: string;
  speakers?: string;
  facilities?: string[];
  rejectionReason?: string;
}

export interface AdminStats {
  totalUsers: number;
}

export async function apiGetAdminStats(): Promise<AdminStats> {
  const response = await fetch("/api/admin/stats", {
    method: "GET",
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Gagal mengambil statistik admin (HTTP ${response.status})`);
  }
  return data;
}

/**
 * Mendapatkan base API URL dari env atau default ke relative URL
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return ""; // Relative path di browser
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
}

/**
 * Mengambil daftar event dari REST API dengan filter opsional
 */
export async function apiGetEvents(params: EventQueryParams = {}): Promise<Event[]> {
  const url = new URL(`${getBaseUrl()}/api/events`, "http://localhost:3000");

  if (params.category && params.category !== "Semua") {
    url.searchParams.set("category", params.category);
  }
  if (params.search && params.search.trim()) {
    url.searchParams.set("search", params.search.trim());
  }
  if (params.price && params.price !== "semua") {
    url.searchParams.set("price", params.price);
  }
  if (params.location && params.location !== "semua") {
    url.searchParams.set("location", params.location);
  }
  if (params.status) {
    url.searchParams.set("status", params.status);
  }
  if (params.sortBy) {
    url.searchParams.set("sortBy", params.sortBy);
  }

  const endpoint = typeof window !== "undefined"
    ? `/api/events${url.search}`
    : url.toString();

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal mengambil data event (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Mengambil detail satu event berdasarkan ID
 */
export async function apiGetEventById(id: string): Promise<Event> {
  const endpoint = typeof window !== "undefined"
    ? `/api/events/${encodeURIComponent(id)}`
    : `${getBaseUrl()}/api/events/${encodeURIComponent(id)}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Event tidak ditemukan.");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal mengambil detail event (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Membuat event baru (Admin)
 */
export async function apiCreateEvent(payload: CreateEventPayload): Promise<Event> {
  const endpoint = typeof window !== "undefined"
    ? `/api/events`
    : `${getBaseUrl()}/api/events`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal menambahkan event baru (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Memperbarui data event (Admin)
 */
export async function apiUpdateEvent(id: string, payload: Partial<CreateEventPayload>): Promise<Event> {
  const endpoint = typeof window !== "undefined"
    ? `/api/events/${encodeURIComponent(id)}`
    : `${getBaseUrl()}/api/events/${encodeURIComponent(id)}`;

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal memperbarui event (HTTP ${response.status})`);
  }

  return response.json();
}

export async function apiRegisterEvent(id: string): Promise<Event> {
  const endpoint = typeof window !== "undefined"
    ? `/api/events/${encodeURIComponent(id)}`
    : `${getBaseUrl()}/api/events/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register" }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal mendaftarkan peserta (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Menghapus event (Admin)
 */
export async function apiDeleteEvent(id: string): Promise<void> {
  const endpoint = typeof window !== "undefined"
    ? `/api/events/${encodeURIComponent(id)}`
    : `${getBaseUrl()}/api/events/${encodeURIComponent(id)}`;

  const response = await fetch(endpoint, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal menghapus event (HTTP ${response.status})`);
  }
}

/**
 * Mengambil daftar seluruh pengguna (role 'user') untuk portal Admin
 */
export async function apiGetAdminUsers(): Promise<AdminUser[]> {
  const endpoint = typeof window !== "undefined"
    ? "/api/admin/users"
    : `${getBaseUrl()}/api/admin/users`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal memuat pengguna (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Memperbarui status / informasi pengguna oleh Admin
 */
export async function apiUpdateAdminUser(
  id: string,
  payload: { isActive?: boolean; name?: string; university?: string | null }
): Promise<AdminUser> {
  const endpoint = typeof window !== "undefined"
    ? `/api/admin/users/${encodeURIComponent(id)}`
    : `${getBaseUrl()}/api/admin/users/${encodeURIComponent(id)}`;

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal memperbarui pengguna (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Menghapus pengguna (role 'user') oleh Admin
 */
export async function apiDeleteAdminUser(id: string): Promise<void> {
  const endpoint = typeof window !== "undefined"
    ? `/api/admin/users/${encodeURIComponent(id)}`
    : `${getBaseUrl()}/api/admin/users/${encodeURIComponent(id)}`;

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal menghapus pengguna (HTTP ${response.status})`);
  }
}

/**
 * Memperbarui profil akun pengguna aktif
 */
export async function apiUpdateProfile(payload: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  university?: string | null;
}): Promise<{
  id: string;
  name: string;
  email: string;
  university?: string;
  avatarUrl?: string | null;
  role: "user" | "admin";
}> {
  const endpoint = typeof window !== "undefined"
    ? "/api/user/profile"
    : `${getBaseUrl()}/api/user/profile`;

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal memperbarui profil (HTTP ${response.status})`);
  }

  return response.json();
}
