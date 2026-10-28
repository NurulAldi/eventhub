/**
 * Automated Integration Test for EventHub PostgreSQL Database Server
 * Menguji konektivitas, migrasi skema, seeding, service layer, dan REST API Route Handlers.
 * Jalankan via: npm run test:integration (atau npx tsx scripts/test-integration.ts)
 */

import { NextRequest } from "next/server";
import { initSchema, queryOne, testConnection, getPool } from "../lib/db";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  seedEvents,
} from "../lib/services/event-service";
import { GET as getEventsRoute, POST as postEventRoute } from "../app/api/events/route";
import {
  GET as getEventByIdRoute,
  PATCH as patchEventRoute,
  DELETE as deleteEventRoute,
} from "../app/api/events/[id]/route";
import { events as mockEvents } from "../lib/mock-data";

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

  // 1. Uji Database Server Connectivity & Skema
  console.log("[1] Pengujian Koneksi ke PostgreSQL Database Server");
  try {
    const conn = await testConnection();
    assert(conn.ok, "Koneksi ke PostgreSQL Server eksternal berhasil", conn.error);
    if (conn.version) {
      console.log(`    Info Server: ${conn.version}`);
    }

    await initSchema();
    const tableCheck = await queryOne<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'events';"
    );
    assert(tableCheck?.table_name === "events", "Tabel 'events' tersedia di skema PostgreSQL Server");
  } catch (err) {
    assert(false, "Koneksi database & skema server", String(err));
  }

  // 2. Uji Seeding & Idempotensi
  console.log("\n[2] Pengujian Seeding & Idempotensi Database Server");
  try {
    const seed1 = await seedEvents(mockEvents);
    assert(seed1.inserted === mockEvents.length, `Seed awal ${mockEvents.length} event ke server berhasil`);

    const countBefore = (await getAllEvents()).length;
    await seedEvents(mockEvents);
    const countAfter = (await getAllEvents()).length;
    assert(
      countBefore === countAfter,
      `Idempotensi seed data terverifikasi (tidak ada duplikasi, total tetap ${countAfter})`
    );
  } catch (err) {
    assert(false, "Seeding database server", String(err));
  }

  // 3. Uji Query & Filter Service Layer
  console.log("\n[3] Pengujian Service Layer (Query & Filter Database Server)");
  try {
    const all = await getAllEvents();
    assert(all.length >= 6, "getAllEvents mengembalikan seluruh event dari PostgreSQL Server");

    const seminarEvents = await getAllEvents({ category: "Seminar" });
    assert(
      seminarEvents.length > 0 && seminarEvents.every((e) => e.category === "Seminar"),
      "Filter kategori 'Seminar' berfungsi dengan benar di server"
    );

    const searchAi = await getAllEvents({ search: "Revolution" });
    assert(
      searchAi.length > 0 && searchAi[0].title.includes("AI Revolution"),
      "Pencarian kata kunci 'Revolution' menemukan record di server"
    );

    const freeEvents = await getAllEvents({ price: "gratis" });
    assert(
      freeEvents.length > 0 && freeEvents.every((e) => e.price === 0),
      "Filter harga 'gratis' hanya mengembalikan event berharga 0"
    );

    const paidEvents = await getAllEvents({ price: "berbayar" });
    assert(
      paidEvents.length > 0 && paidEvents.every((e) => e.price > 0),
      "Filter harga 'berbayar' hanya mengembalikan event berharga > 0"
    );
  } catch (err) {
    assert(false, "Service layer filters", String(err));
  }

  // 4. Uji CRUD Service Layer
  console.log("\n[4] Pengujian Operasi CRUD pada Database Server");
  let testCreatedId = "";
  try {
    // Detail by ID
    const evt1 = await getEventById("1");
    assert(evt1 !== null && evt1.id === "1", "getEventById('1') mengembalikan record dari server");

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

  // 5. Uji Route Handlers (REST API Next.js terhubung ke Server)
  console.log("\n[5] Pengujian Route Handlers (Next.js REST API terhubung ke PostgreSQL Server)");
  try {
    // GET /api/events
    const reqGetAll = new NextRequest("http://localhost:3000/api/events");
    const resGetAll = await getEventsRoute(reqGetAll);
    assert(resGetAll.status === 200, "GET /api/events mengembalikan status 200");
    const dataGetAll = await resGetAll.json();
    assert(Array.isArray(dataGetAll) && dataGetAll.length >= 6, "GET /api/events mengembalikan array JSON dari server");

    // GET /api/events?category=Workshop
    const reqGetCategory = new NextRequest("http://localhost:3000/api/events?category=Workshop");
    const resGetCategory = await getEventsRoute(reqGetCategory);
    const dataCategory = await resGetCategory.json();
    assert(
      resGetCategory.status === 200 &&
        dataCategory.every((e: { category: string }) => e.category === "Workshop"),
      "GET /api/events?category=Workshop mengembalikan status 200 dengan filter kategori dari server"
    );

    // GET /api/events/[id] - ID Valid
    const reqGetDetail = new NextRequest("http://localhost:3000/api/events/1");
    const resGetDetail = await getEventByIdRoute(reqGetDetail, {
      params: Promise.resolve({ id: "1" }),
    });
    assert(resGetDetail.status === 200, "GET /api/events/1 mengembalikan status 200");
    const dataDetail = await resGetDetail.json();
    assert(dataDetail.id === "1", "GET /api/events/1 mengembalikan detail record ID '1' dari server");

    // GET /api/events/[id] - ID Tidak Ditemukan -> 404
    const reqGet404 = new NextRequest("http://localhost:3000/api/events/id-palsu-9999");
    const resGet404 = await getEventByIdRoute(reqGet404, {
      params: Promise.resolve({ id: "id-palsu-9999" }),
    });
    assert(resGet404.status === 404, "GET /api/events/[id] ID tidak ditemukan menghasilkan status 404");

    // POST /api/events - Validasi Gagal -> 400
    const reqPostInvalid = new NextRequest("http://localhost:3000/api/events", {
      method: "POST",
      body: JSON.stringify({
        title: "",
        description: "pendek",
      }),
    });
    const resPostInvalid = await postEventRoute(reqPostInvalid);
    assert(resPostInvalid.status === 400, "POST /api/events payload tidak valid menghasilkan status 400");

    // POST /api/events - Sukses -> 201
    const reqPostValid = new NextRequest("http://localhost:3000/api/events", {
      method: "POST",
      body: JSON.stringify({
        title: "Workshop Cloud Computing & DevOps UNP 2026",
        description: "Pelatihan infrastruktur modern menggunakan Docker, Kubernetes, dan CI/CD pipeline.",
        date: "2026-12-15",
        time: "10:00 - 15:00 WIB",
        location: "Lab Komputer Jaringan FT UNP",
        category: "Workshop",
        organizer: "Himpunan Mahasiswa Teknik Elektro",
        price: 30000,
        quota: 60,
      }),
    });
    const resPostValid = await postEventRoute(reqPostValid);
    assert(resPostValid.status === 201, "POST /api/events data valid menghasilkan status 201 (Created)");
    const createdFromApi = await resPostValid.json();

    // PATCH /api/events/[id]
    const reqPatch = new NextRequest(`http://localhost:3000/api/events/${createdFromApi.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "completed",
      }),
    });
    const resPatch = await patchEventRoute(reqPatch, {
      params: Promise.resolve({ id: createdFromApi.id }),
    });
    assert(resPatch.status === 200, "PATCH /api/events/[id] mengembalikan status 200 dari server");

    // DELETE /api/events/[id]
    const reqDelete = new NextRequest(`http://localhost:3000/api/events/${createdFromApi.id}`, {
      method: "DELETE",
    });
    const resDelete = await deleteEventRoute(reqDelete, {
      params: Promise.resolve({ id: createdFromApi.id }),
    });
    assert(resDelete.status === 200, "DELETE /api/events/[id] mengembalikan status 200 dari server");

    // Verifikasi ID yang telah dihapus di route detail menghasilkan 404
    const resCheckDeletedRoute = await getEventByIdRoute(
      new NextRequest(`http://localhost:3000/api/events/${createdFromApi.id}`),
      { params: Promise.resolve({ id: createdFromApi.id }) }
    );
    assert(resCheckDeletedRoute.status === 404, "Record yang dihapus via API diverifikasi mengembalikan 404");
  } catch (err) {
    assert(false, "Route handler testing", String(err));
  }

  // Tutup pool koneksi agar proses pengujian selesai rapi
  await getPool().end();

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
