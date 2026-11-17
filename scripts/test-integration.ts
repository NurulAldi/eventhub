/**
 * Automated Integration Test for EventHub PostgreSQL Database Server & Week 5 Features
 * Menguji:
 * 1. Konektivitas & Skema Tabel PostgreSQL (users, events, event_registrations, user_wishlists, notification_preferences, user_notifications)
 * 2. Operasi CRUD Event
 * 3. Persistensi Registrasi Tiket (atomik, transaksi DB, penolakan duplikasi, kuota konsisten, penolakan pemilik event)
 * 4. Persistensi Wishlist/Bookmark (tambah/hapus, isolasi data per user)
 * 5. Persistensi Preferensi Notifikasi & Notifikasi (kategori notifikasi tersimpan di PostgreSQL)
 * 6. Validasi Input Payload dengan Zod
 * 7. Rate Limiting pada Endpoint Autentikasi (HTTP 429 & Retry-After)
 * 8. REST API Route Handlers
 * Jalankan via: npm run test:integration
 */

import { NextRequest } from "next/server";
import { initSchema, query, queryOne, testConnection, getPool } from "../lib/db";
import {
  getAllEvents,
  createEvent,
} from "../lib/services/event-service";
import {
  registerUserForEvent,
  getUserRegistrations,
  RegistrationError,
} from "../lib/services/registration-service";
import {
  toggleUserWishlist,
  getUserWishlistEventIds,
  getUserWishlistEvents,
} from "../lib/services/wishlist-service";
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "../lib/services/notification-service";
import { checkRateLimit, resetRateLimit } from "../lib/rate-limit";
import { GET as getEventsRoute, POST as postEventRoute } from "../app/api/events/route";
import { GET as getEventByIdRoute } from "../app/api/events/[id]/route";
import { POST as loginRoute } from "../app/api/auth/login/route";
import { POST as registerRoute } from "../app/api/auth/register/route";

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
  const createdUserIds: string[] = [];

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
      const requiredTables = [
        "users",
        "events",
        "event_registrations",
        "user_wishlists",
        "notification_preferences",
        "user_notifications",
      ];
      const tableCheck = await query<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = ANY($1::varchar[])`,
        [requiredTables]
      );
      assert(
        tableCheck.length === requiredTables.length,
        "Seluruh 6 tabel Week 5 tersedia di PostgreSQL Server (users, events, registrations, wishlists, preferences, notifications)"
      );
    } catch (err) {
      assert(false, "Koneksi database & skema server", String(err));
    }

    // 2. Setup Data Pengujian Sementara
    console.log("\n[2] Setup Data Pengujian Terisolasi (Users & Events)");
    let testUserId = "";
    let testUser2Id = "";
    let testEvt1Id = "";
    let testEvt2Id = "";
    let limitedQuotaEvtId = "";

    try {
      // Buat user uji
      const testEmail1 = `test_user_${Date.now()}@example.com`;
      const testEmail2 = `test_user2_${Date.now()}@example.com`;

      const user1 = await queryOne<{ id: string }>(
        `INSERT INTO users (name, email, university, password_hash, role)
         VALUES ($1, $2, $3, $4, 'user')
         RETURNING id`,
        ["User Uji 1", testEmail1, "UNP Padang", "fakehash"]
      );
      if (user1) {
        testUserId = user1.id;
        createdUserIds.push(testUserId);
      }

      const user2 = await queryOne<{ id: string }>(
        `INSERT INTO users (name, email, university, password_hash, role)
         VALUES ($1, $2, $3, $4, 'user')
         RETURNING id`,
        ["User Uji 2", testEmail2, "UNP Padang", "fakehash"]
      );
      if (user2) {
        testUser2Id = user2.id;
        createdUserIds.push(testUser2Id);
      }

      // Buat event uji
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

      // Event kuota 1 untuk menguji quota limit
      const evtLimited = await createEvent({
        title: "Test Event Kuota Terbatas",
        description: "Deskripsi event kuota 1 peserta.",
        date: "2026-11-28",
        time: "10:00 - 12:00 WIB",
        location: "Ruang Rapat",
        category: "Lomba",
        organizer: "Juri Lomba",
        price: 0,
        quota: 1,
      });
      limitedQuotaEvtId = evtLimited.id;
      createdTestIds.push(limitedQuotaEvtId);

      assert(
        !!testUserId && !!testUser2Id && !!testEvt1Id && !!testEvt2Id,
        "User dan Event pengujian sementara berhasil dibuat"
      );
    } catch (err) {
      assert(false, "Setup data pengujian", String(err));
    }

    // 3. Pengujian Service Layer Events
    console.log("\n[3] Pengujian Service Layer (Query & Filter Database Server)");
    try {
      const allEvents = await getAllEvents();
      assert(allEvents.length >= 2, "getAllEvents mengembalikan event aktif dari PostgreSQL Server");

      const seminarEvents = await getAllEvents({ category: "Seminar" });
      assert(
        seminarEvents.some((e) => e.id === testEvt1Id),
        "Filter kategori 'Seminar' berfungsi dengan benar di server"
      );

      const searchEvents = await getAllEvents({ search: "Seminar AI" });
      assert(
        searchEvents.some((e) => e.id === testEvt1Id),
        "Pencarian kata kunci 'Seminar AI' menemukan record di server"
      );

      const freeEvents = await getAllEvents({ price: "gratis" });
      assert(
        freeEvents.every((e) => e.price === 0),
        "Filter harga 'gratis' hanya mengembalikan event berharga 0"
      );

      const paidEvents = await getAllEvents({ price: "berbayar" });
      assert(
        paidEvents.every((e) => e.price > 0),
        "Filter harga 'berbayar' hanya mengembalikan event berharga > 0"
      );
    } catch (err) {
      assert(false, "Service layer query & filter", String(err));
    }

    // 4. Pengujian Persistensi Registrasi Tiket Event (Target 14 November)
    console.log("\n[4] Pengujian Persistensi Registrasi Tiket (PostgreSQL Server)");
    try {
      // 4A: Pendaftaran berhasil
      const regResult = await registerUserForEvent(testUserId, testEvt1Id);
      assert(
        !!regResult.ticket && regResult.ticket.ticketStatus === "active",
        "Pendaftaran pertama berhasil dan menghasilkan tiket aktif",
        regResult.ticket?.ticketId
      );
      assert(
        regResult.event.registeredCount === 1,
        "registered_count pada event bertambah menjadi 1"
      );

      // Verifikasi data tersimpan di tabel event_registrations
      const dbTicket = await queryOne<{ ticket_code: string; user_id: string }>(
        "SELECT ticket_code, user_id FROM event_registrations WHERE user_id = $1 AND event_id = $2",
        [testUserId, testEvt1Id]
      );
      assert(
        dbTicket?.ticket_code === regResult.ticket.ticketId,
        "Tiket tersimpan permanen di tabel event_registrations PostgreSQL"
      );

      // 4B: Duplikasi pendaftaran ditolak (Unique constraint)
      let duplicateCaught = false;
      try {
        await registerUserForEvent(testUserId, testEvt1Id);
      } catch (err) {
        if (err instanceof RegistrationError && err.statusCode === 409) {
          duplicateCaught = true;
        }
      }
      assert(duplicateCaught, "Pendaftaran duplikat ditolak dengan status 409 (Conflict)");

      // 4C: Pemilik event tidak dapat mendaftar ke event miliknya sendiri
      let creatorCaught = false;
      const ownEvent = await createEvent({
        title: "Event Buatan Sendiri",
        description: "Event yang dibuat oleh testUserId.",
        date: "2026-11-30",
        location: "UNP",
        category: "Seminar",
        organizer: "User Uji 1",
        price: 0,
        quota: 50,
      }, testUserId);
      createdTestIds.push(ownEvent.id);

      try {
        await registerUserForEvent(testUserId, ownEvent.id);
      } catch (err) {
        if (err instanceof RegistrationError && err.statusCode === 403) {
          creatorCaught = true;
        }
      }
      assert(creatorCaught, "Pembuat event ditolak saat mendaftar event sendiri dengan status 403 (Forbidden)");

      // 4C2: User dengan role admin tidak dapat mendaftar ke event apapun
      let adminCaught = false;
      const adminEmail = `test_admin_${Date.now()}@example.com`;
      const adminUser = await queryOne<{ id: string }>(
        `INSERT INTO users (name, email, university, password_hash, role)
         VALUES ($1, $2, $3, $4, 'admin')
         RETURNING id`,
        ["Admin Uji", adminEmail, "UNP Padang", "fakehash"]
      );
      if (adminUser) {
        createdUserIds.push(adminUser.id);
        try {
          await registerUserForEvent(adminUser.id, testEvt1Id);
        } catch (err) {
          if (err instanceof RegistrationError && err.statusCode === 403) {
            adminCaught = true;
          }
        }
      }
      assert(adminCaught, "Akun dengan role admin ditolak saat mendaftar event dengan status 403 (Forbidden)");

      // 4D: Kuota penuh ditolak secara atomik
      // User 1 mendaftar event kuota 1
      await registerUserForEvent(testUserId, limitedQuotaEvtId);
      let quotaFullCaught = false;
      try {
        // User 2 mencoba mendaftar event kuota 1 yang sudah penuh
        await registerUserForEvent(testUser2Id, limitedQuotaEvtId);
      } catch (err) {
        if (err instanceof RegistrationError && err.statusCode === 409) {
          quotaFullCaught = true;
        }
      }
      assert(quotaFullCaught, "Pendaftaran pada event kuota penuh ditolak dengan status 409 (Conflict)");

      // 4E: getUserRegistrations mengembalikan tiket terdaftar lengkap
      const userTickets = await getUserRegistrations(testUserId);
      assert(
        userTickets.length >= 2 && userTickets.some((t) => t.eventId === testEvt1Id),
        "getUserRegistrations mengembalikan tiket resmi user dari PostgreSQL"
      );
    } catch (err) {
      assert(false, "Pengujian registrasi tiket", String(err));
    }

    // 5. Pengujian Persistensi Wishlist & Notifikasi (Target 15 November)
    console.log("\n[5] Pengujian Persistensi Wishlist & Notifikasi (PostgreSQL Server)");
    try {
      // 5A: Toggle Wishlist Tambah
      const toggleAdd = await toggleUserWishlist(testUserId, testEvt1Id);
      assert(toggleAdd.isInWishlist === true, "toggleUserWishlist menambahkan event ke wishlist (isInWishlist: true)");

      const wishlistIds = await getUserWishlistEventIds(testUserId);
      assert(wishlistIds.includes(testEvt1Id), "ID event tersimpan di tabel user_wishlists");

      const wishlistEvents = await getUserWishlistEvents(testUserId);
      assert(
        wishlistEvents.some((e) => e.id === testEvt1Id),
        "getUserWishlistEvents mengembalikan data event lengkap dari PostgreSQL"
      );

      // Verifikasi isolasi: Wishlist User 1 tidak muncul pada User 2
      const user2Wishlist = await getUserWishlistEventIds(testUser2Id);
      assert(
        !user2Wishlist.includes(testEvt1Id),
        "Wishlist terisolasi antar pengguna (User 2 tidak memiliki wishlist User 1)"
      );

      // 5B: Toggle Wishlist Hapus
      const toggleRemove = await toggleUserWishlist(testUserId, testEvt1Id);
      assert(toggleRemove.isInWishlist === false, "toggleUserWishlist menghapus event dari wishlist saat ditekan lagi");

      const wishlistAfterRemove = await getUserWishlistEventIds(testUserId);
      assert(
        !wishlistAfterRemove.includes(testEvt1Id),
        "Event terhapus permanen dari tabel user_wishlists"
      );

      // 5C: Preferensi Notifikasi
      const defaultPrefs = await getUserNotificationPreferences(testUserId);
      assert(
        defaultPrefs.reminderEvent === true && defaultPrefs.updateEvent === true,
        "getUserNotificationPreferences mengembalikan preferensi default (reminderEvent: true)"
      );

      // Perbarui preferensi
      const updatedPrefs = await updateUserNotificationPreferences(testUserId, {
        reminderEvent: false,
        updateEvent: true,
        generalInfo: true,
      });
      assert(
        updatedPrefs.reminderEvent === false && updatedPrefs.generalInfo === true,
        "updateUserNotificationPreferences berhasil memperbarui pengaturan di PostgreSQL"
      );

      // Verifikasi persistensi setelah pembacaan ulang
      const reloadedPrefs = await getUserNotificationPreferences(testUserId);
      assert(
        reloadedPrefs.reminderEvent === false && reloadedPrefs.generalInfo === true,
        "Preferensi notifikasi tetap tersimpan di server saat dibaca ulang"
      );
    } catch (err) {
      assert(false, "Pengujian wishlist & notifikasi", String(err));
    }

    // 6. Pengujian Input Validation Zod (Target 16 November)
    console.log("\n[6] Pengujian Validasi Input Menggunakan Zod");
    try {
      // 6A: Register dengan email format salah
      const reqBadEmail = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Budi Santoso",
          email: "budi-bukan-email",
          university: "UNP",
          password: "password123",
        }),
      });
      const resBadEmail = await registerRoute(reqBadEmail);
      assert(resBadEmail.status === 400, "Zod menolak email format salah pada registrasi (HTTP 400)");

      // 6B: Register dengan password kurang dari 8 karakter
      const reqShortPass = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Budi Santoso",
          email: "budi@example.com",
          university: "UNP",
          password: "123",
        }),
      });
      const resShortPass = await registerRoute(reqShortPass);
      assert(resShortPass.status === 400, "Zod menolak kata sandi kurang dari 8 karakter (HTTP 400)");

      // 6C: Login dengan email kosong
      const reqEmptyLogin = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "", password: "" }),
      });
      const resEmptyLogin = await loginRoute(reqEmptyLogin);
      assert(resEmptyLogin.status === 400, "Zod menolak login dengan field kosong (HTTP 400)");
    } catch (err) {
      assert(false, "Pengujian validasi Zod", String(err));
    }

    // 7. Pengujian Rate Limiting (Target 16 November)
    console.log("\n[7] Pengujian Rate Limiting pada Endpoint Autentikasi");
    try {
      resetRateLimit();
      const testKey = "auth:login:127.0.0.99";

      // Lakukan 5 request (batas limit)
      let allAllowed = true;
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(testKey, 5, 60_000);
        if (!result.success) allAllowed = false;
      }
      assert(allAllowed, "5 request pertama dalam batas rate limit diizinkan (success: true)");

      // Request ke-6 harus ditolak
      const exceededResult = checkRateLimit(testKey, 5, 60_000);
      assert(
        !exceededResult.success && exceededResult.remaining === 0,
        "Request ke-6 melebihi batas rate limit ditolak (success: false)"
      );
      assert(
        exceededResult.retryAfterSeconds > 0,
        "Menyediakan durasi tunggu retryAfterSeconds yang valid"
      );

      resetRateLimit();
    } catch (err) {
      assert(false, "Pengujian rate limiting", String(err));
    }

    // 8. Pengujian Route Handlers
    console.log("\n[8] Pengujian Route Handlers REST API Terhubung ke Database");
    try {
      // GET /api/events
      const reqGet = new NextRequest("http://localhost:3000/api/events");
      const resGet = await getEventsRoute(reqGet);
      assert(resGet.status === 200, "GET /api/events mengembalikan status 200");

      // GET /api/events/[id]
      const reqGetDetail = new NextRequest(`http://localhost:3000/api/events/${testEvt1Id}`);
      const resGetDetail = await getEventByIdRoute(reqGetDetail, {
        params: Promise.resolve({ id: testEvt1Id }),
      });
      assert(resGetDetail.status === 200, "GET /api/events/[id] mengembalikan detail record dari server");

      // GET /api/events/[id] Not Found -> 404
      const reqGet404 = new NextRequest("http://localhost:3000/api/events/id-palsu-9999");
      const resGet404 = await getEventByIdRoute(reqGet404, {
        params: Promise.resolve({ id: "id-palsu-9999" }),
      });
      assert(resGet404.status === 404, "GET /api/events/[id] ID tidak ditemukan menghasilkan status 404");

      // POST /api/events tanpa auth -> 401
      const reqPostUnauth = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        body: JSON.stringify({
          title: "Workshop Cloud Computing",
          description: "Pelatihan infrastruktur modern.",
        }),
      });
      const resPostUnauth = await postEventRoute(reqPostUnauth);
      assert(resPostUnauth.status === 401, "POST /api/events tanpa autentikasi menghasilkan status 401 (Unauthorized)");
    } catch (err) {
      assert(false, "Route handler testing", String(err));
    }
  } finally {
    // 9. Pembersihan Data Uji
    console.log("\n[9] Pembersihan Data Uji dari Database");
    if (createdTestIds.length > 0) {
      await query(
        `DELETE FROM events WHERE id = ANY($1::varchar[])`,
        [createdTestIds]
      );
      console.log(`  ✓ Seluruh data event uji (${createdTestIds.length} record) telah dibersihkan.`);
    }

    if (createdUserIds.length > 0) {
      await query(
        `DELETE FROM users WHERE id = ANY($1::uuid[])`,
        [createdUserIds]
      );
      console.log(`  ✓ Seluruh data user uji (${createdUserIds.length} record) telah dibersihkan.`);
    }

    await getPool().end();
  }

  console.log("\n====================================================");
  console.log(`HASIL AKHIR: ${passedCount} LULUS, ${failedCount} GAGAL`);
  console.log("====================================================");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log("Semua pengujian integrasi PostgreSQL Database Server & Fitur Week 5 berhasil 100%!");
    process.exit(0);
  }
}

runTests();
