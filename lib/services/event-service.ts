/**
 * Event Service Layer
 * Memisahkan logika bisnis, validasi, dan akses data database dari API Route Handlers.
 */

import { query, queryOne } from "@/lib/db";
import { Event, EventCategory, EventStatus } from "@/types";

export interface EventFilters {
  category?: string;
  search?: string;
  price?: "semua" | "gratis" | "berbayar" | string;
  location?: "semua" | "online" | "offline" | string;
  status?: string;
  sortBy?: "terbaru" | "populer" | "harga-rendah" | string;
}

export interface CreateEventDTO {
  id?: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  category: EventCategory | string;
  image?: string;
  price?: number;
  organizer: string;
  quota?: number;
  registeredCount?: number;
  status?: EventStatus;
  requirements?: string[];
  contactPic?: string;
  isPopular?: boolean;
}

export interface DatabaseEventRow {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string | null;
  location: string;
  category: string;
  image: string;
  price: number;
  organizer: string;
  quota: number;
  registered_count: number;
  status: string;
  requirements: unknown;
  contact_pic: string | null;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Mapper dari baris database PostgreSQL ke objek TypeScript Event
 */
export function mapRowToEvent(row: DatabaseEventRow): Event {
  let parsedRequirements: string[] = [];
  if (Array.isArray(row.requirements)) {
    parsedRequirements = row.requirements;
  } else if (typeof row.requirements === "string") {
    try {
      parsedRequirements = JSON.parse(row.requirements);
    } catch {
      parsedRequirements = [];
    }
  }

  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    date: row.date,
    time: row.time || undefined,
    location: row.location,
    category: row.category as EventCategory,
    image: row.image,
    price: Number(row.price) || 0,
    organizer: row.organizer,
    quota: row.quota !== null && row.quota !== undefined ? Number(row.quota) : undefined,
    registeredCount: row.registered_count !== null && row.registered_count !== undefined ? Number(row.registered_count) : 0,
    status: (row.status as EventStatus) || "active",
    requirements: parsedRequirements,
    contactPic: row.contact_pic || undefined,
    isPopular: Boolean(row.is_popular),
  };
}

/**
 * Validasi data event sebelum disimpan
 */
export function validateEventInput(data: Partial<CreateEventDTO>, isUpdate = false): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || data.title.trim().length < 3) {
      errors.push("Judul event wajib diisi minimal 3 karakter.");
    }
  }

  if (!isUpdate || data.description !== undefined) {
    if (!data.description || data.description.trim().length < 10) {
      errors.push("Deskripsi event wajib diisi minimal 10 karakter.");
    }
  }

  if (!isUpdate || data.date !== undefined) {
    if (!data.date || !data.date.trim()) {
      errors.push("Tanggal event wajib diisi.");
    }
  }

  if (!isUpdate || data.location !== undefined) {
    if (!data.location || !data.location.trim()) {
      errors.push("Lokasi event wajib diisi.");
    }
  }

  if (!isUpdate || data.category !== undefined) {
    if (!data.category || !data.category.trim()) {
      errors.push("Kategori event wajib diisi.");
    }
  }

  if (!isUpdate || data.organizer !== undefined) {
    if (!data.organizer || !data.organizer.trim()) {
      errors.push("Penyelenggara event wajib diisi.");
    }
  }

  if (data.price !== undefined && (typeof data.price !== "number" || data.price < 0)) {
    errors.push("Harga event harus berupa angka positif atau 0 (gratis).");
  }

  if (data.quota !== undefined && (typeof data.quota !== "number" || data.quota < 0)) {
    errors.push("Kuota event harus berupa angka lebih besar atau sama dengan 0.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Mengambil daftar event berdasarkan filter dan sorting
 */
export async function getAllEvents(filters: EventFilters = {}): Promise<Event[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Filter Kategori
  if (filters.category && filters.category !== "Semua") {
    conditions.push(`LOWER(category) = LOWER($${paramIndex++})`);
    params.push(filters.category);
  }

  // Filter Pencarian (title, description, organizer, location)
  if (filters.search && filters.search.trim()) {
    const searchPattern = `%${filters.search.trim()}%`;
    conditions.push(`(
      title ILIKE $${paramIndex} OR
      description ILIKE $${paramIndex} OR
      organizer ILIKE $${paramIndex} OR
      location ILIKE $${paramIndex}
    )`);
    params.push(searchPattern);
    paramIndex++;
  }

  // Filter Harga
  if (filters.price === "gratis") {
    conditions.push(`price = 0`);
  } else if (filters.price === "berbayar") {
    conditions.push(`price > 0`);
  }

  // Filter Lokasi (online vs offline)
  if (filters.location === "online") {
    conditions.push(`(location ILIKE '%daring%' OR location ILIKE '%zoom%')`);
  } else if (filters.location === "offline") {
    conditions.push(`(location NOT ILIKE '%daring%' AND location NOT ILIKE '%zoom%')`);
  }

  // Filter Status
  if (filters.status && filters.status !== "Semua") {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filters.status);
  }

  // Clause WHERE
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Sorting
  let orderClause = "ORDER BY date DESC, created_at DESC";
  if (filters.sortBy === "populer") {
    orderClause = "ORDER BY is_popular DESC, date DESC";
  } else if (filters.sortBy === "harga-rendah") {
    orderClause = "ORDER BY price ASC, date DESC";
  } else if (filters.sortBy === "terbaru") {
    orderClause = "ORDER BY date DESC, created_at DESC";
  }

  const sql = `SELECT * FROM events ${whereClause} ${orderClause};`;
  const rows = await query<DatabaseEventRow>(sql, params);

  return rows.map(mapRowToEvent);
}

/**
 * Mengambil satu event berdasarkan ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  if (!id || typeof id !== "string") return null;

  const sql = `SELECT * FROM events WHERE id = $1 LIMIT 1;`;
  const row = await queryOne<DatabaseEventRow>(sql, [id]);

  return row ? mapRowToEvent(row) : null;
}

/**
 * Membuat event baru di database
 */
export async function createEvent(data: CreateEventDTO): Promise<Event> {
  const validation = validateEventInput(data, false);
  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  const id = data.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const defaultImage = "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80";

  const sql = `
    INSERT INTO events (
      id, title, description, date, time, location,
      category, image, price, organizer, quota,
      registered_count, status, requirements, contact_pic, is_popular
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13, $14::jsonb, $15, $16
    )
    RETURNING *;
  `;

  const params = [
    id,
    data.title.trim(),
    data.description.trim(),
    data.date.trim(),
    data.time ? data.time.trim() : "09:00 - 13:00 WIB",
    data.location.trim(),
    data.category.trim(),
    data.image ? data.image.trim() : defaultImage,
    Number(data.price) || 0,
    data.organizer.trim(),
    data.quota !== undefined ? Number(data.quota) : 100,
    data.registeredCount !== undefined ? Number(data.registeredCount) : 0,
    data.status || "active",
    JSON.stringify(data.requirements || []),
    data.contactPic || null,
    Boolean(data.isPopular),
  ];

  const row = await queryOne<DatabaseEventRow>(sql, params);
  if (!row) {
    throw new Error("Gagal menyimpan data event ke database.");
  }

  return mapRowToEvent(row);
}

/**
 * Memperbarui data event yang sudah ada
 */
export async function updateEvent(id: string, data: Partial<CreateEventDTO>): Promise<Event | null> {
  if (!id) throw new Error("ID event diperlukan untuk pembaruan.");

  const existing = await getEventById(id);
  if (!existing) return null;

  const validation = validateEventInput(data, true);
  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    params.push(data.title.trim());
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    params.push(data.description.trim());
  }

  if (data.date !== undefined) {
    updates.push(`date = $${paramIndex++}`);
    params.push(data.date.trim());
  }

  if (data.time !== undefined) {
    updates.push(`time = $${paramIndex++}`);
    params.push(data.time ? data.time.trim() : null);
  }

  if (data.location !== undefined) {
    updates.push(`location = $${paramIndex++}`);
    params.push(data.location.trim());
  }

  if (data.category !== undefined) {
    updates.push(`category = $${paramIndex++}`);
    params.push(data.category.trim());
  }

  if (data.image !== undefined) {
    updates.push(`image = $${paramIndex++}`);
    params.push(data.image.trim());
  }

  if (data.price !== undefined) {
    updates.push(`price = $${paramIndex++}`);
    params.push(Number(data.price));
  }

  if (data.organizer !== undefined) {
    updates.push(`organizer = $${paramIndex++}`);
    params.push(data.organizer.trim());
  }

  if (data.quota !== undefined) {
    updates.push(`quota = $${paramIndex++}`);
    params.push(Number(data.quota));
  }

  if (data.registeredCount !== undefined) {
    updates.push(`registered_count = $${paramIndex++}`);
    params.push(Number(data.registeredCount));
  }

  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    params.push(data.status);
  }

  if (data.requirements !== undefined) {
    updates.push(`requirements = $${paramIndex++}::jsonb`);
    params.push(JSON.stringify(data.requirements));
  }

  if (data.contactPic !== undefined) {
    updates.push(`contact_pic = $${paramIndex++}`);
    params.push(data.contactPic ? data.contactPic.trim() : null);
  }

  if (data.isPopular !== undefined) {
    updates.push(`is_popular = $${paramIndex++}`);
    params.push(Boolean(data.isPopular));
  }

  if (updates.length === 0) {
    return existing;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);

  const sql = `
    UPDATE events
    SET ${updates.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *;
  `;

  const updatedRow = await queryOne<DatabaseEventRow>(sql, params);
  return updatedRow ? mapRowToEvent(updatedRow) : null;
}

/**
 * Menghapus event berdasarkan ID
 */
export async function deleteEvent(id: string): Promise<boolean> {
  if (!id) return false;

  const sql = `DELETE FROM events WHERE id = $1 RETURNING id;`;
  const deleted = await queryOne<{ id: string }>(sql, [id]);

  return !!deleted;
}

/**
 * Seed data event ke database secara idempoten
 */
export async function seedEvents(eventsList: Event[]): Promise<{ inserted: number; total: number }> {
  let count = 0;

  for (const evt of eventsList) {
    const sql = `
      INSERT INTO events (
        id, title, description, date, time, location,
        category, image, price, organizer, quota,
        registered_count, status, requirements, contact_pic, is_popular
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14::jsonb, $15, $16
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        date = EXCLUDED.date,
        time = EXCLUDED.time,
        location = EXCLUDED.location,
        category = EXCLUDED.category,
        image = EXCLUDED.image,
        price = EXCLUDED.price,
        organizer = EXCLUDED.organizer,
        quota = EXCLUDED.quota,
        registered_count = EXCLUDED.registered_count,
        status = EXCLUDED.status,
        requirements = EXCLUDED.requirements,
        contact_pic = EXCLUDED.contact_pic,
        is_popular = EXCLUDED.is_popular,
        updated_at = CURRENT_TIMESTAMP;
    `;

    const params = [
      evt.id,
      evt.title,
      evt.description,
      evt.date,
      evt.time || "09:00 - 13:00 WIB",
      evt.location,
      evt.category,
      evt.image,
      evt.price || 0,
      evt.organizer,
      evt.quota || 100,
      evt.registeredCount || 0,
      evt.status || "active",
      JSON.stringify(evt.requirements || []),
      evt.contactPic || null,
      Boolean(evt.isPopular),
    ];

    await query(sql, params);
    count++;
  }

  return { inserted: count, total: eventsList.length };
}
