/**
 * Automated Integration Test for EventHub PostgreSQL Database Server
 * Menguji konektivitas, migrasi skema, service layer, dan REST API Route Handlers.
 * Jalankan via: npm run test:integration (atau npx tsx scripts/test-integration.ts)
 */

import { NextRequest } from "next/server";
import { initSchema, query, queryOne, testConnection, getPool } from "../lib/db";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../lib/services/event-service";
import { GET as getEventsRoute, POST as postEventRoute } from "../app/api/events/route";
import {
  GET as getEventByIdRoute,
  PATCH as patchEventRoute,
  DELETE as deleteEventRoute,
} from "../app/api/events/[id]/route";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("====================================================");
  console.log("   EventHub UNP — PostgreSQL Server Test Suite      ");
  console.log("====================================================\n");

  const createdTestIds: string[] = [];

  try {
    // 1. Uji Database Server Connectivity & Skema
    console.log("[1] Pengujian Koneksi ke PostgreSQL Database Server");
    try {
      const conn = await testConnection();
      assert(conn.ok, "Koneksi ke PostgreSQL Server eksternal berhasil", conn.error);
      if (conn.version) {
        console.log(`    Info Server: ${conn.version}`);
      }

      await initSchema();
      const tableCheck = await queryOne<{ table_count: string }>(
        `SELECT COUNT(*)::text AS table_count
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN ('users', 'events');`
      );
      assert(tableCheck?.table_count === "2", "Tabel 'users' dan 'events' tersedia di skema PostgreSQL Server");
    } catch (err) {
      assert(false, "Koneksi database & skema server", String(err));
    }

    // 2. Setup Data Pengujian Sementara
    console.log("\n[2] Setup Data Pengujian Terisolasi");
    let testEvt1Id = "";
    let testEvt2Id = "";
    try {
      const evt1 = await createEvent({
        title: "Test Event Seminar AI",
        description: "Deskripsi seminar AI pengujian sistem database.",
        date: "2026-11-20",
        time: "09:00 - 12:00 WIB",
        location: "Gedung Uji A",
        category: "Seminar",
        organizer: "Panitia Uji AI",
        price: 0,
        quota: 100,
      });
      testEvt1Id = evt1.id;
      createdTestIds.push(testEvt1Id);

      const evt2 = await createEvent({
        title: "Test Event Workshop Web",
        description: "Deskripsi workshop web pengujian sistem database.",
        date: "2026-11-25",
        time: "13:00 - 16:00 WIB",
        location: "Lab Komputer Uji",
        category: "Workshop",
        organizer: "Panitia Uji Web",
        price: 50000,
        quota: 50,
      });
      testEvt2Id = evt2.id;
      createdTestIds.push(testEvt2Id);

      assert(!!testEvt1Id && !!testEvt2Id, "Event pengujian sementara berhasil dibuat");
    } catch (err) {
      assert(false, "Setup data pengujian", String(err));
    }

    // 3. Uji Query & Filter Service Layer
    console.log("\n[3] Pengujian Service Layer (Query & Filter Database Server)");
    try {
      const all = await getAllEvents();
      assert(all.length >= 2, "getAllEvents mengembalikan seluruh event aktif dari PostgreSQL Server");

      const seminarEvents = await getAllEvents({ category: "Seminar" });
      assert(
        seminarEvents.some((e) => e.id === testEvt1Id),
        "Filter kategori 'Seminar' berfungsi dengan benar di server"
      );

      const searchAi = await getAllEvents({ search: "Seminar AI" });
      assert(
        searchAi.some((e) => e.id === testEvt1Id),
        "Pencarian kata kunci 'Seminar AI' menemukan record di server"
      );

      const freeEvents = await getAllEvents({ price: "gratis" });
      assert(
        freeEvents.some((e) => e.id === testEvt1Id && e.price === 0),
        "Filter harga 'gratis' hanya mengembalikan event berharga 0"
      );

      const paidEvents = await getAllEvents({ price: "berbayar" });
      assert(
        paidEvents.some((e) => e.id === testEvt2Id && e.price > 0),
        "Filter harga 'berbayar' hanya mengembalikan event berharga > 0"
      );
    } catch (err) {
      assert(false, "Service layer filters", String(err));
    }

    // 4. Uji Operasi CRUD Service Layer
    console.log("\n[4] Pengujian Operasi CRUD pada Database Server");
    let testCreatedId = "";
    try {
      // Detail by ID
      const evt1 = await getEventById(testEvt1Id);
      assert(evt1 !== null && evt1.id === testEvt1Id, "getEventById mengembalikan record dari server");

      const notFound = await getEventById("non-existent-999");
      assert(notFound === null, "getEventById ID tidak ada mengembalikan null");

      // Create Event
      const newEvt = await createEvent({
        title: "Lomba Keamanan Siber UNP 2026",
        description: "Kompetisi CTF dan cyber defense tingkat nasional untuk mahasiswa perguruan tinggi se-Indonesia.",
        date: "2026-12-05",
        time: "09:00 - 16:00 WIB",
        location: "Gedung Pusat Komputer UNP",
        category: "Lomba",
        organizer: "Komunitas Cyber UNP",
        price: 25000,
        quota: 40,
      });
      testCreatedId = newEvt.id;
      createdTestIds.push(testCreatedId);
      assert(
        newEvt.title === "Lomba Keamanan Siber UNP 2026" && !!newEvt.id,
        `createEvent berhasil menyimpan record baru ke server dengan ID: ${newEvt.id}`
      );

      // Update Event
      const updated = await updateEvent(testCreatedId, {
        title: "Lomba Keamanan Siber UNP 2026 (Updated)",
        status: "completed",
      });
      assert(
        updated !== null &&
          updated.title === "Lomba Keamanan Siber UNP 2026 (Updated)" &&
          updated.status === "completed",
        "updateEvent berhasil memperbarui record di database server"
      );

      // Delete Event
      const deleted = await deleteEvent(testCreatedId);
      assert(deleted === true, "deleteEvent berhasil menghapus record dari server");

      const recheckDeleted = await getEventById(testCreatedId);
      assert(recheckDeleted === null, "Record yang dihapus terverifikasi hilang dari database server");
    } catch (err) {
      assert(false, "CRUD service operations", String(err));
    }

    // 5. Uji Route Handlers (Next.js REST API terhubung ke PostgreSQL Server)
    console.log("\n[5] Pengujian Route Handlers (Next.js REST API terhubung ke PostgreSQL Server)");
    try {
      // GET /api/events
      const reqGetAll = new NextRequest("http://localhost:3000/api/events");
      const resGetAll = await getEventsRoute(reqGetAll);
      assert(resGetAll.status === 200, "GET /api/events mengembalikan status 200");
      const dataGetAll = await resGetAll.json();
      assert(Array.isArray(dataGetAll) && dataGetAll.length >= 2, "GET /api/events mengembalikan array JSON dari server");

      // GET /api/events?category=Workshop
      const reqGetCategory = new NextRequest("http://localhost:3000/api/events?category=Workshop");
      const resGetCategory = await getEventsRoute(reqGetCategory);
      const dataCategory = await resGetCategory.json();
      assert(
        resGetCategory.status === 200 &&
          dataCategory.some((e: { id: string }) => e.id === testEvt2Id),
        "GET /api/events?category=Workshop mengembalikan status 200 dengan filter kategori dari server"
      );

      // GET /api/events/[id] - ID Valid
      const reqGetDetail = new NextRequest(`http://localhost:3000/api/events/${testEvt1Id}`);
      const resGetDetail = await getEventByIdRoute(reqGetDetail, {
        params: Promise.resolve({ id: testEvt1Id }),
      });
      assert(resGetDetail.status === 200, "GET /api/events/[id] mengembalikan status 200");
      const dataDetail = await resGetDetail.json();
      assert(dataDetail.id === testEvt1Id, "GET /api/events/[id] mengembalikan detail record dari server");

      // GET /api/events/[id] - ID Tidak Ditemukan -> 404
      const reqGet404 = new NextRequest("http://localhost:3000/api/events/id-palsu-9999");
      const resGet404 = await getEventByIdRoute(reqGet404, {
        params: Promise.resolve({ id: "id-palsu-9999" }),
      });
      assert(resGet404.status === 404, "GET /api/events/[id] ID tidak ditemukan menghasilkan status 404");

      // POST /api/events - Unauthenticated -> 401
      const reqPostUnauth = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        body: JSON.stringify({
          title: "Workshop Cloud Computing",
          description: "Pelatihan infrastruktur modern.",
        }),
      });
      const resPostUnauth = await postEventRoute(reqPostUnauth);
      assert(resPostUnauth.status === 401, "POST /api/events tanpa autentikasi menghasilkan status 401 (Unauthorized)");

      // PATCH /api/events/[id] - Unauthenticated -> 401
      const reqPatchUnauth = new NextRequest(`http://localhost:3000/api/events/${testEvt1Id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "completed",
        }),
      });
      const resPatchUnauth = await patchEventRoute(reqPatchUnauth, {
        params: Promise.resolve({ id: testEvt1Id }),
      });
      assert(resPatchUnauth.status === 401, "PATCH /api/events/[id] tanpa autentikasi menghasilkan status 401 (Unauthorized)");

      // DELETE /api/events/[id] - Unauthenticated -> 401
      const reqDeleteUnauth = new NextRequest(`http://localhost:3000/api/events/${testEvt1Id}`, {
        method: "DELETE",
      });
      const resDeleteUnauth = await deleteEventRoute(reqDeleteUnauth, {
        params: Promise.resolve({ id: testEvt1Id }),
      });
      assert(resDeleteUnauth.status === 401, "DELETE /api/events/[id] tanpa autentikasi menghasilkan status 401 (Unauthorized)");
    } catch (err) {
      assert(false, "Route handler testing", String(err));
    }
  } finally {
    // Bersihkan seluruh data test yang dibuat agar database tetap bersih tanpa data dummy
    console.log("\n[6] Pembersihan Data Uji dari Database");
    if (createdTestIds.length > 0) {
      await query(
        `DELETE FROM events WHERE id = ANY($1::varchar[])`,
        [createdTestIds]
      );
      console.log(`  ✓ Seluruh data uji (${createdTestIds.length} record) telah dibersihkan.`);
    }

    // Tutup pool koneksi agar proses pengujian selesai rapi
    await getPool().end();
  }

  console.log("\n====================================================");
  console.log(`HASIL AKHIR: ${passedCount} LULUS, ${failedCount} GAGAL`);
  console.log("====================================================");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log("Semua pengujian integrasi PostgreSQL Database Server berhasil 100%!");
    process.exit(0);
  }
}

runTests();
