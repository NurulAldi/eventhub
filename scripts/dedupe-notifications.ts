/**
 * Membersihkan notifikasi admin yang duplikat akibat format ID lama
 * (`admin-submission-<eventId>-pending_review-<updatedAt>`).
 *
 * Setiap event hanya disisakan satu notifikasi "Pengajuan baru" dengan ID stabil
 * `admin-submission-<eventId>`. Status "dibaca" dipertahankan jika salah satu
 * baris duplikat sudah dibaca. Aman dijalankan berulang kali.
 *
 * Jalankan via: npx tsx scripts/dedupe-notifications.ts
 */
import { getPool } from "../lib/db";

const PREFIX = "admin-submission-";
const STATUS_MARKER = "-pending_review-";

function legacyEventId(notificationId: string): string | null {
  if (!notificationId.startsWith(PREFIX)) return null;
  const index = notificationId.indexOf(STATUS_MARKER);
  if (index < 0) return null;
  const eventId = notificationId.slice(PREFIX.length, index);
  return eventId || null;
}

async function main() {
  const pool = getPool();
  try {
    const legacy = await pool.query<{ id: string; user_id: string; read: boolean }>(
      `SELECT id, user_id, read FROM user_notifications
       WHERE role = 'admin' AND id LIKE $1`,
      [`${PREFIX}%${STATUS_MARKER}%`]
    );

    if (legacy.rowCount === 0) {
      console.log("✓ Tidak ada notifikasi duplikat lama yang perlu dibersihkan.");
      return;
    }

    // Kelompokkan per (admin, event)
    const groups = new Map<string, { ids: string[]; anyRead: boolean }>();
    for (const row of legacy.rows) {
      const eventId = legacyEventId(row.id);
      if (!eventId) continue;
      const key = `${row.user_id}::${eventId}`;
      const group = groups.get(key) || { ids: [], anyRead: false };
      group.ids.push(row.id);
      group.anyRead = group.anyRead || row.read;
      groups.set(key, group);
    }

    let removed = 0;
    for (const [key, group] of groups) {
      const [userId, eventId] = key.split("::");

      await pool.query(`DELETE FROM user_notifications WHERE user_id = $1 AND id = ANY($2::varchar[])`, [
        userId,
        group.ids,
      ]);
      removed += group.ids.length;

      const event = await pool.query<{ title: string }>(`SELECT title FROM events WHERE id = $1`, [eventId]);
      const title = event.rows[0]?.title;

      await pool.query(
        `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
         VALUES ($1, $2, 'admin', 'Pengajuan baru', $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET read = user_notifications.read OR EXCLUDED.read`,
        [
          `${PREFIX}${eventId}`,
          userId,
          title
            ? `Pengajuan event ${title} telah dikirim atau diperbarui dan menunggu review.`
            : "Pengajuan event menunggu review.",
          `/event/${eventId}`,
          group.anyRead,
        ]
      );
    }

    console.log(`✓ ${removed} notifikasi duplikat dihapus, ${groups.size} notifikasi unik dipertahankan.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("✗ Gagal membersihkan notifikasi duplikat:", error);
  process.exitCode = 1;
});