/**
 * Script Seeding Database PostgreSQL Server EventHub
 * Mengisi database server dengan data event awal dari mock-data.ts.
 * Bersifat idempoten (aman dijalankan berulang tanpa duplikasi).
 * Jalankan via: npm run db:seed (atau npx tsx scripts/seed.ts)
 */

import { initSchema, testConnection, getDatabaseUrl, getPool } from "../lib/db";
import { seedEvents, getAllEvents } from "../lib/services/event-service";
import { events } from "../lib/mock-data";

async function main() {
  console.log("=========================================");
  console.log("   EventHub UNP — PostgreSQL Server Seed ");
  console.log("=========================================");

  try {
    const dbUrl = getDatabaseUrl();
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
    console.log(`Target Database Server: ${maskedUrl}`);

    const conn = await testConnection();
    if (!conn.ok) {
      throw new Error(`Koneksi database server gagal: ${conn.error}`);
    }
    console.log(`✓ Terhubung ke PostgreSQL: ${conn.version}`);

    // Pastikan skema tabel sudah siap
    await initSchema();

    console.log(`Memproses seeding ${events.length} event awal ke database server...`);
    const result = await seedEvents(events);
    console.log(`✓ Berhasil memproses ${result.inserted} event ke dalam database server.`);

    // Verifikasi data di database server
    const all = await getAllEvents();
    console.log(`✓ Verifikasi: Total event tersimpan di database server sekarang = ${all.length}`);

    console.log("Daftar event tersimpan di PostgreSQL Server:");
    all.forEach((evt, idx) => {
      console.log(`  ${idx + 1}. [ID: ${evt.id}] ${evt.title} (${evt.category} - ${evt.date})`);
    });

    console.log("\nSeeding database server selesai dengan sukses.");
    await getPool().end();
    process.exit(0);
  } catch (error) {
    console.error("✗ Gagal melakukan seeding database server:", error);
    process.exit(1);
  }
}

main();
