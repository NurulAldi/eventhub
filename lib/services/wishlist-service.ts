import { query, queryOne } from "@/lib/db";
import { Event } from "@/types";
import { DatabaseEventRow, mapRowToEvent } from "./event-service";

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
  const event = await queryOne<{ id: string }>(
    `SELECT id FROM events WHERE id = $1`,
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
