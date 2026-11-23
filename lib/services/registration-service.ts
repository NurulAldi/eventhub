import { getPool, query, queryOne } from "@/lib/db";
import { Event, RegisteredEvent } from "@/types";
import { mapRowToEvent, DatabaseEventRow, syncEventStatuses } from "./event-service";

export class RegistrationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "RegistrationError";
    this.statusCode = statusCode;
  }
}

interface RegistrationRow {
  id: string;
  user_id: string;
  event_id: string;
  ticket_code: string;
  ticket_status: "active" | "completed" | "cancelled";
  qr_code_mock: string | null;
  registered_at: Date;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

function parseDateOnly(dateStr: string): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Mendaftarkan pengguna ke event dengan transaksi aman dari race condition
 */
export async function registerUserForEvent(
  userId: string,
  eventId: string
): Promise<{ ticket: RegisteredEvent; event: Event }> {
  if (!userId) throw new RegistrationError("User belum login.", 401);
  if (!eventId) throw new RegistrationError("ID event wajib diisi.", 400);

  // Sinkronisasi status event jika ada yang telah kedaluwarsa
  await syncEventStatuses();

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    // 1. Verifikasi akun pengguna
    const userRes = await client.query<UserRow>(
      "SELECT id, name, email, role, is_active FROM users WHERE id = $1",
      [userId]
    );
    const user = userRes.rows[0];
    if (!user || !user.is_active) {
      throw new RegistrationError("Akun pengguna tidak aktif atau tidak ditemukan.", 403);
    }

    // Role admin dilarang mendaftar ke event apapun
    if (user.role === "admin") {
      throw new RegistrationError(
        "Akun dengan role admin tidak dapat mendaftar event.",
        403
      );
    }

    // 2. Kunci row event untuk menghindari race condition kuota (SELECT ... FOR UPDATE)
    const eventRes = await client.query<DatabaseEventRow>(
      "SELECT * FROM events WHERE id = $1 FOR UPDATE",
      [eventId]
    );
    const eventRow = eventRes.rows[0];
    if (!eventRow) {
      throw new RegistrationError(`Event dengan ID '${eventId}' tidak ditemukan.`, 404);
    }

    const event = mapRowToEvent(eventRow);

    // 3. Validasi status event
    if (event.status !== "active") {
      throw new RegistrationError(
        "Event tidak dalam status aktif untuk pendaftaran.",
        400
      );
    }

    // 4. Validasi tanggal pelaksanaan event
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = parseDateOnly(event.date);
    if (eventDate) {
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        throw new RegistrationError(
          "Event sudah berakhir, pendaftaran telah ditutup.",
          400
        );
      }
    }

    // 5. Validasi deadline pendaftaran jika tersedia
    if (event.registrationDeadline) {
      const deadline = parseDateOnly(event.registrationDeadline);
      if (deadline) {
        deadline.setHours(23, 59, 59, 999);
        if (new Date() > deadline) {
          throw new RegistrationError(
            "Batas waktu pendaftaran untuk event ini telah berakhir.",
            400
          );
        }
      }
    }

    // 6. Validasi pemilik event (penyelenggara tidak boleh mendaftar ke event sendiri)
    const isCreator =
      Boolean(event.createdBy && event.createdBy === userId) ||
      event.organizer.trim().toLowerCase() === user.name.trim().toLowerCase();

    if (isCreator) {
      throw new RegistrationError(
        "Pembuat event tidak dapat mendaftarkan diri pada event sendiri.",
        403
      );
    }

    // 7. Validasi duplikasi pendaftaran
    const existingReg = await client.query(
      "SELECT id FROM event_registrations WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );
    if (existingReg.rows.length > 0) {
      throw new RegistrationError(
        "Anda sudah terdaftar pada event ini.",
        409
      );
    }

    // 8. Validasi kuota peserta
    const currentQuota = eventRow.quota;
    const currentRegistered = eventRow.registered_count;
    if (currentRegistered >= currentQuota) {
      throw new RegistrationError(
        "Kuota pendaftaran untuk event ini sudah penuh.",
        409
      );
    }

    // 9. Buat kode tiket unik
    const ticketCode = `EVT-${Math.floor(100000 + Math.random() * 900000)}`;
    const qrCodeMock = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketCode}`;

    // 10. Simpan pendaftaran ke PostgreSQL
    const insertRegRes = await client.query<RegistrationRow>(
      `INSERT INTO event_registrations (user_id, event_id, ticket_code, ticket_status, qr_code_mock)
       VALUES ($1, $2, $3, 'active', $4)
       RETURNING id, user_id, event_id, ticket_code, ticket_status, qr_code_mock, registered_at`,
      [userId, eventId, ticketCode, qrCodeMock]
    );
    const regRecord = insertRegRes.rows[0];

    // 11. Tambah registered_count event secara atomik
    const updateEventRes = await client.query<DatabaseEventRow>(
      `UPDATE events
       SET registered_count = registered_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [eventId]
    );

    await client.query("COMMIT;");

    const updatedEvent = mapRowToEvent(updateEventRes.rows[0]);
    const formattedDate = new Date(updatedEvent.date).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const ticket: RegisteredEvent = {
      ticketId: regRecord.ticket_code,
      eventId: updatedEvent.id,
      eventTitle: updatedEvent.title,
      category: updatedEvent.category,
      date: formattedDate,
      time: updatedEvent.time || "Waktu belum ditentukan",
      location: updatedEvent.location,
      eventPrice: Number(updatedEvent.price) || 0,
      registeredAt: regRecord.registered_at.toISOString().slice(0, 10),
      ticketStatus: regRecord.ticket_status,
      qrCodeMock: regRecord.qr_code_mock || undefined,
    };

    return { ticket, event: updatedEvent };
  } catch (error) {
    await client.query("ROLLBACK;");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Mengambil seluruh tiket pendaftaran pengguna dari PostgreSQL
 */
export async function getUserRegistrations(userId: string): Promise<RegisteredEvent[]> {
  if (!userId) return [];

  const sql = `
    SELECT 
      r.id AS reg_id,
      r.ticket_code,
      r.ticket_status,
      r.qr_code_mock,
      r.registered_at,
      e.id AS event_id,
      e.title AS event_title,
      e.category,
      e.date AS event_date,
      e.time AS event_time,
      e.location AS event_location,
      e.price AS event_price,
      e.status AS event_status
    FROM event_registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = $1
    ORDER BY r.registered_at DESC;
  `;

  interface RowResult {
    reg_id: string;
    ticket_code: string;
    ticket_status: "active" | "completed" | "cancelled";
    qr_code_mock: string | null;
    registered_at: Date;
    event_id: string;
    event_title: string;
    category: string;
    event_date: string;
    event_time: string | null;
    event_location: string;
    event_price: number;
    event_status: string;
  }

  const rows = await query<RowResult>(sql, [userId]);

  return rows.map((row) => {
    const formattedDate = new Date(row.event_date).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return {
      ticketId: row.ticket_code,
      eventId: row.event_id,
      eventTitle: row.event_title,
      category: row.category,
      date: formattedDate,
      time: row.event_time || "Waktu belum ditentukan",
      location: row.event_location,
      eventPrice: Number(row.event_price) || 0,
      registeredAt: row.registered_at.toISOString().slice(0, 10),
      ticketStatus: row.ticket_status,
      qrCodeMock:
        row.qr_code_mock ||
        `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${row.ticket_code}`,
    };
  });
}

/**
 * Periksa apakah user terdaftar pada suatu event
 */
export async function isUserRegistered(userId: string, eventId: string): Promise<boolean> {
  if (!userId || !eventId) return false;
  const res = await queryOne<{ id: string }>(
    "SELECT id FROM event_registrations WHERE user_id = $1 AND event_id = $2",
    [userId, eventId]
  );
  return !!res;
}

/**
 * Batalkan pendaftaran tiket event pengguna
 */
export async function cancelRegistration(
  userId: string,
  eventId: string
): Promise<boolean> {
  if (!userId || !eventId) return false;

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    const deleted = await client.query<{ id: string }>(
      "DELETE FROM event_registrations WHERE user_id = $1 AND event_id = $2 RETURNING id",
      [userId, eventId]
    );

    if (deleted.rows.length > 0) {
      await client.query(
        `UPDATE events
         SET registered_count = GREATEST(0, registered_count - 1),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [eventId]
      );
    }

    await client.query("COMMIT;");
    return deleted.rows.length > 0;
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}
