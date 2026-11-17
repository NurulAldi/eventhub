/**
 * Script Inisialisasi Skema Database PostgreSQL Server EventHub
 * Menghubungkan ke PostgreSQL Server dan membuat tabel serta indeks.
 * Jalankan via: npm run db:init (atau npx tsx scripts/init-db.ts)
 */

import { initSchema, query, testConnection, getDatabaseUrl, getPool } from "../lib/db";

async function main() {
  console.log("=========================================");
  console.log("   EventHub UNP — PostgreSQL Server Init ");
  console.log("=========================================");

  try {
    const dbUrl = getDatabaseUrl();
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
    console.log(`Target Database Server: ${maskedUrl}`);

    console.log("Memeriksa koneksi ke database server...");
    const conn = await testConnection();
    if (!conn.ok) {
      throw new Error(`Koneksi database server gagal: ${conn.error}`);
    }
    console.log(`✓ Terhubung ke PostgreSQL: ${conn.version}`);
    console.log(`✓ Database aktif: ${conn.database}`);

    console.log("Membuat skema tabel dan indeks PostgreSQL...");
    await initSchema();
    const tables = await query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name IN (
         'users', 'events', 'event_registrations', 'user_wishlists', 'notification_preferences', 'user_notifications'
       )
       ORDER BY table_name`
    );
    const tableNames = new Set(tables.map((table) => table.table_name));
    const requiredTables = [
      "users",
      "events",
      "event_registrations",
      "user_wishlists",
      "notification_preferences",
      "user_notifications",
    ];
    const missingTables = requiredTables.filter((t) => !tableNames.has(t));
    if (missingTables.length > 0) {
      throw new Error(
        `Verifikasi skema gagal. Tabel belum ada: ${missingTables.join(", ")}. Tabel tersedia: ${Array.from(tableNames).join(", ") || "(tidak ada)"}`
      );
    }
    console.log("✓ Seluruh tabel (users, events, registrations, wishlists, notifications) berhasil diinisialisasi.");
    console.log("Inisialisasi selesai tanpa error.");
    await getPool().end();
    process.exit(0);
  } catch (error) {
    console.error("✗ Gagal menginisialisasi database server:", error);
    process.exit(1);
  }
}

main();
