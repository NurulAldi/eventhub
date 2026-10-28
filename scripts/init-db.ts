/**
 * Script Inisialisasi Skema Database PostgreSQL Server EventHub
 * Menghubungkan ke PostgreSQL Server dan membuat tabel serta indeks.
 * Jalankan via: npm run db:init (atau npx tsx scripts/init-db.ts)
 */

import { initSchema, testConnection, getDatabaseUrl } from "../lib/db";

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
    console.log("✓ Skema tabel 'events' dan indeks berhasil diinisialisasi.");
    console.log("Inisialisasi selesai tanpa error.");
    process.exit(0);
  } catch (error) {
    console.error("✗ Gagal menginisialisasi database server:", error);
    process.exit(1);
  }
}

main();
