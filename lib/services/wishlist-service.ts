import { query, queryOne } from "@/lib/db";
import { Event } from "@/types";
import { DatabaseEventRow, mapRowToEvent } from "./event-service";

/**
 * Status event yang masih dianggap aktif/tampil. Event dengan status lain
 * (pending_review, needs_revision, rejected, completed, cancelled, dst.)
 * tidak boleh tersisa di wishlist pengguna.
 */
export const ACTIVE_WISHLIST_EVENT_STATUSES = ["active", "published"] as const;

const activeStatusList = ACTIVE_WISHLIST_EVENT_STATUSES.map((status) => `'${status}'`).join(", ");

/**
 * Menghapus event yang sudah tidak aktif dari wishlist semua pengguna.
 * Dipanggil setelah status event berubah dan setelah sinkronisasi status otomatis.
 * @returns jumlah baris wishlist yang dihapus
 */
export async function removeInactiveEventsFromWishlists(eventIds?: string[]): Promise<number> {
  const params: unknown[] = [];
  let filter = "";
  if (eventIds) {
    if (eventIds.length === 0) return 0;
    params.push(eventIds);
    filter = `AND w.event_id = ANY($1::varchar[])`;
  }

  const result = await query(
    `DELETE FROM user_wishlists w
     USING events e
     WHERE w.event_id = e.id
       AND e.status NOT IN (${activeStatusList})
       ${filter}
     RETURNING w.event_id`,
    params
  );
  return result.length;
}

/**
 * Mengambil daftar eventId yang dibookmark oleh pengguna
 */
export async function getUserWishlistEventIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  const rows = await query<{ event_id: string }>(
    `SELECT event_id FROM user_wishlists WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map((r) => r.event_id);
}

/**
 * Mengambil seluruh event yang ada di wishlist pengguna beserta datanya
 * Menghilangkan event yang sudah dihapus oleh admin
 */
export async function getUserWishlistEvents(userId: string): Promise<Event[]> {
  if (!userId) return [];
  const sql = `
    SELECT e.*
    FROM user_wishlists w
    JOIN events e ON w.event_id = e.id
    WHERE w.user_id = $1
    ORDER BY w.created_at DESC;
  `;
  const rows = await query<DatabaseEventRow>(sql, [userId]);
  return rows.map(mapRowToEvent);
}

/**
 * Memeriksa apakah event tertentu ada di wishlist pengguna
 */
export async function isEventInWishlist(userId: string, eventId: string): Promise<boolean> {
  if (!userId || !eventId) return false;
  const row = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM user_wishlists WHERE user_id = $1 AND event_id = $2`,
    [userId, eventId]
  );
  return !!row;
}

/**
 * Toggle bookmark event untuk pengguna
 */
export async function toggleUserWishlist(
  userId: string,
  eventId: string
): Promise<{ isInWishlist: boolean }> {
  if (!userId) throw new Error("User belum login.");
  if (!eventId) throw new Error("ID event wajib diisi.");

  // Pastikan event ada di database
  const event = await queryOne<{ id: string; status: string }>(
    `SELECT id, status FROM events WHERE id = $1`,
    [eventId]
  );
  if (!event) {
    throw new Error("Event tidak ditemukan.");
  }

  const existing = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM user_wishlists WHERE user_id = $1 AND event_id = $2`,
    [userId, eventId]
  );

  if (existing) {
    await query(
      `DELETE FROM user_wishlists WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId]
    );
    return { isInWishlist: false };
  } else {
    // Event yang tidak aktif tidak boleh masuk wishlist.
    if (!ACTIVE_WISHLIST_EVENT_STATUSES.includes(event.status as (typeof ACTIVE_WISHLIST_EVENT_STATUSES)[number])) {
      throw new Error("Event ini tidak aktif sehingga tidak dapat disimpan ke wishlist.");
    }
    await query(
      `INSERT INTO user_wishlists (user_id, event_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [userId, eventId]
    );
    return { isInWishlist: true };
  }
}

/**
 * Menambahkan event ke wishlist
 */
export async function addToUserWishlist(userId: string, eventId: string): Promise<boolean> {
  if (!userId || !eventId) return false;
  const res = await query(
    `INSERT INTO user_wishlists (user_id, event_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, event_id) DO NOTHING`,
    [userId, eventId]
  );
  return res !== null;
}

/**
 * Menghapus event dari wishlist
 */
export async function removeFromUserWishlist(userId: string, eventId: string): Promise<boolean> {
  if (!userId || !eventId) return false;
  await query(
    `DELETE FROM user_wishlists WHERE user_id = $1 AND event_id = $2`,
    [userId, eventId]
  );
  return true;
}
