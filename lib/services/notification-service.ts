import { query, queryOne } from "@/lib/db";
import { AppNotification, NotificationRole, ReminderTrigger } from "@/lib/notifications";
import { getAllEvents, getUserSubmissions } from "./event-service";
import { getUserWishlistEventIds } from "./wishlist-service";
import { getUserRegistrations } from "./registration-service";
import { getCalendarDaysDiff } from "@/lib/event-lifecycle";

export interface NotificationPreferences {
  reminderEvent: boolean;
  updateEvent: boolean;
  generalInfo: boolean;
  eventReminders: Record<string, ReminderTrigger>;
  updatedAt?: string;
}

interface PreferencesRow {
  user_id: string;
  reminder_event: boolean;
  update_event: boolean;
  general_info: boolean;
  event_reminders: Record<string, ReminderTrigger> | null;
  updated_at: Date;
}

interface NotificationRow {
  id: string;
  user_id: string;
  role: NotificationRole;
  title: string;
  message: string;
  href: string | null;
  read: boolean;
  created_at: Date;
}

/**
 * Mengambil preferensi notifikasi pengguna dari PostgreSQL
 */
export async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  if (!userId) {
    return {
      reminderEvent: true,
      updateEvent: true,
      generalInfo: false,
      eventReminders: {},
    };
  }

  const row = await queryOne<PreferencesRow>(
    `SELECT user_id, reminder_event, update_event, general_info, event_reminders, updated_at
     FROM notification_preferences
     WHERE user_id = $1`,
    [userId]
  );

  if (row) {
    return {
      reminderEvent: row.reminder_event,
      updateEvent: row.update_event,
      generalInfo: row.general_info,
      eventReminders: row.event_reminders || {},
      updatedAt: row.updated_at.toISOString(),
    };
  }

  // Jika belum ada, buat record default
  const defaultRow = await queryOne<PreferencesRow>(
    `INSERT INTO notification_preferences (user_id, reminder_event, update_event, general_info, event_reminders)
     VALUES ($1, TRUE, TRUE, FALSE, '{}'::jsonb)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING user_id, reminder_event, update_event, general_info, event_reminders, updated_at`,
    [userId]
  );

  return {
    reminderEvent: defaultRow?.reminder_event ?? true,
    updateEvent: defaultRow?.update_event ?? true,
    generalInfo: defaultRow?.general_info ?? false,
    eventReminders: defaultRow?.event_reminders || {},
    updatedAt: defaultRow?.updated_at.toISOString(),
  };
}

/**
 * Memperbarui preferensi notifikasi pengguna di PostgreSQL
 */
export async function updateUserNotificationPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  if (!userId) throw new Error("User belum login.");

  const current = await getUserNotificationPreferences(userId);

  const reminderEvent = updates.reminderEvent !== undefined ? updates.reminderEvent : current.reminderEvent;
  const updateEvent = updates.updateEvent !== undefined ? updates.updateEvent : current.updateEvent;
  const generalInfo = updates.generalInfo !== undefined ? updates.generalInfo : current.generalInfo;
  const eventReminders = updates.eventReminders !== undefined ? updates.eventReminders : current.eventReminders;

  const row = await queryOne<PreferencesRow>(
    `INSERT INTO notification_preferences (user_id, reminder_event, update_event, general_info, event_reminders, updated_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id) DO UPDATE
     SET reminder_event = EXCLUDED.reminder_event,
         update_event = EXCLUDED.update_event,
         general_info = EXCLUDED.general_info,
         event_reminders = EXCLUDED.event_reminders,
         updated_at = CURRENT_TIMESTAMP
     RETURNING user_id, reminder_event, update_event, general_info, event_reminders, updated_at`,
    [userId, reminderEvent, updateEvent, generalInfo, JSON.stringify(eventReminders)]
  );

  return {
    reminderEvent: row?.reminder_event ?? reminderEvent,
    updateEvent: row?.update_event ?? updateEvent,
    generalInfo: row?.general_info ?? generalInfo,
    eventReminders: row?.event_reminders || eventReminders,
    updatedAt: row?.updated_at.toISOString(),
  };
}

/**
 * Mengambil daftar notifikasi pengguna dari PostgreSQL
 */
export async function getUserNotifications(
  userId: string,
  role: NotificationRole
): Promise<AppNotification[]> {
  if (!userId) return [];

  const rows = await query<NotificationRow>(
    `SELECT id, user_id, role, title, message, href, read, created_at
     FROM user_notifications
     WHERE user_id = $1 AND role = $2
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId, role]
  );

  return rows.map((r) => ({
    id: r.id,
    role: r.role,
    title: r.title,
    message: r.message,
    href: r.href || undefined,
    read: r.read,
    createdAt: r.created_at.toISOString(),
  }));
}

/**
 * Menandai satu notifikasi sebagai telah dibaca
 */
export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  if (!userId || !notificationId) return;
  await query(
    `UPDATE user_notifications SET read = TRUE WHERE user_id = $1 AND id = $2`,
    [userId, notificationId]
  );
}

/**
 * Menandai seluruh notifikasi pengguna sebagai telah dibaca
 */
export async function markAllNotificationsRead(
  userId: string,
  role: NotificationRole
): Promise<void> {
  if (!userId) return;
  await query(
    `UPDATE user_notifications SET read = TRUE WHERE user_id = $1 AND role = $2`,
    [userId, role]
  );
}

function daysUntil(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return Number.NaN;

  const targetDay = Date.UTC(year, month - 1, day);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((targetDay - today) / 86400000);
}

/**
 * Menyinkronkan notifikasi pengguna di database sesuai preferensi dan data event terbaru
 */
export async function syncUserNotifications(
  userId: string,
  role: NotificationRole
): Promise<AppNotification[]> {
  if (!userId) return [];

  const prefs = await getUserNotificationPreferences(userId);
  const allEvents = await getAllEvents({ status: "Semua" });

  if (role === "admin") {
    // Notifikasi pengajuan event untuk admin.
    // ID harus stabil per event: memakai updated_at membuat satu pengajuan yang
    // diedit berkali-kali menghasilkan notifikasi baru setiap kali disimpan.
    for (const event of allEvents) {
      if (event.status === "pending_review") {
        const notifId = `admin-submission-${event.id}`;
        // Jika admin sudah membaca lalu user memperbaiki pengajuan, notifikasi yang
        // sama diaktifkan kembali (bukan ditambah baris baru).
        await query(
          `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
           VALUES ($1, $2, 'admin', 'Pengajuan baru', $3, $4, FALSE)
           ON CONFLICT (id) DO UPDATE
           SET message = EXCLUDED.message,
               href = EXCLUDED.href,
               read = CASE
                 WHEN user_notifications.read = TRUE
                   AND (user_notifications.message IS DISTINCT FROM EXCLUDED.message
                        OR user_notifications.href IS DISTINCT FROM EXCLUDED.href)
                 THEN FALSE
                 ELSE user_notifications.read
               END`,
          [
            notifId,
            userId,
            `Pengajuan event ${event.title} telah dikirim atau diperbarui dan menunggu review.`,
            `/event/${event.id}`,
          ]
        );
      }
    }
  } else {
    // Notifikasi untuk pengguna (hanya jika preferensi reminder aktif)
    const wishlistIds = new Set(await getUserWishlistEventIds(userId));
    const userRegistrations = await getUserRegistrations(userId).catch(() => []);
    const registeredEventIds = new Set(userRegistrations.map((r) => r.eventId));

    for (const event of allEvents) {
      const isInterested = wishlistIds.has(event.id) || registeredEventIds.has(event.id);

      // 1. Notifikasi pembatalan event (kategori update event)
      if (prefs.updateEvent && isInterested && event.status === "cancelled") {
        const notifId = `cancelled-${event.id}`;
        await query(
          `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
           VALUES ($1, $2, 'user', 'Event dibatalkan', $3, $4, FALSE)
           ON CONFLICT (id) DO NOTHING`,
          [
            notifId,
            userId,
            `Event ${event.title} telah dibatalkan oleh penyelenggara.`,
            `/event/${event.id}`,
          ]
        );
      }

      // 2. Notifikasi reminder event tersimpan / didaftarkan (kategori reminder event)
      if (prefs.reminderEvent && isInterested && event.status !== "cancelled" && event.status !== "rejected") {
        const deadlineDays = getCalendarDaysDiff(event.registrationDeadline);
        const eventDays = getCalendarDaysDiff(event.date);

        // A. H-1 deadline pendaftaran event
        if (deadlineDays === 1) {
          const notifId = `reminder-deadline-h-1-${event.id}-${event.registrationDeadline}`;
          await query(
            `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
             VALUES ($1, $2, 'user', 'H-1 Deadline Pendaftaran', $3, $4, FALSE)
             ON CONFLICT (id) DO NOTHING`,
            [
              notifId,
              userId,
              `Pendaftaran untuk event ${event.title} akan ditutup besok (${event.registrationDeadline}). Jangan sampai ketinggalan!`,
              `/event/${event.id}`,
            ]
          );
        }

        // B. H-1 tanggal pelaksanaan event
        if (eventDays === 1) {
          const notifId = `reminder-event-h-1-${event.id}-${event.date}`;
          await query(
            `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
             VALUES ($1, $2, 'user', 'H-1 Tanggal Pelaksanaan', $3, $4, FALSE)
             ON CONFLICT (id) DO NOTHING`,
            [
              notifId,
              userId,
              `Event ${event.title} akan dilaksanakan besok (${event.date}). Siapkan diri Anda!`,
              `/event/${event.id}`,
            ]
          );
        }

        // C. Ketika masuk tanggal pelaksanaan event (Hari H / Berlangsung)
        if (eventDays === 0) {
          const notifId = `reminder-event-today-${event.id}-${event.date}`;
          await query(
            `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
             VALUES ($1, $2, 'user', 'Event Berlangsung Hari Ini', $3, $4, FALSE)
             ON CONFLICT (id) DO NOTHING`,
            [
              notifId,
              userId,
              `Event ${event.title} berlangsung hari ini! Selamat mengikuti acara.`,
              `/event/${event.id}`,
            ]
          );
        }

        // Kuota hampir penuh (90%)
        const percentage = event.quota ? Math.round(((event.registeredCount || 0) / event.quota) * 100) : 0;
        if (percentage >= 90 && percentage < 100) {
          const notifId = `quota-${event.id}-${percentage}`;
          await query(
            `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
             VALUES ($1, $2, 'user', 'Kuota hampir penuh', $3, $4, FALSE)
             ON CONFLICT (id) DO NOTHING`,
            [
              notifId,
              userId,
              `Kuota ${event.title} telah terisi ${percentage}%.`,
              `/event/${event.id}`,
            ]
          );
        }
      }
    }

    // 3. Notifikasi status pengajuan event dari sisi pengguna
    const userSubmissions = await getUserSubmissions(userId).catch(() => []);
    const statusNotificationMap: Record<string, { title: string; message: string }> = {
      pending_review: {
        title: "Pengajuan event diterima",
        message: "Pengajuan event berhasil dikirim dan sedang ditinjau.",
      },
      needs_revision: {
        title: "Event perlu diperbaiki",
        message: "Pengajuan event perlu dilengkapi sebelum dapat dipublikasikan.",
      },
      rejected: {
        title: "Event ditolak",
        message: "Pengajuan event ditolak.",
      },
      active: {
        title: "Event disetujui",
        message: "Event telah disetujui dan sekarang tampil di EventHub Kampus.",
      },
      completed: {
        title: "Event selesai",
        message: "Event telah berstatus selesai.",
      },
      cancelled: {
        title: "Event dibatalkan",
        message: "Event telah dibatalkan oleh penyelenggara.",
      },
    };

    for (const submission of userSubmissions) {
      const status = submission.status || "pending_review";
      const config = statusNotificationMap[status];
      if (config) {
        const notifId = `submission-${submission.id}-${status}`;
        const message = status === "rejected" && submission.rejectionReason
          ? `Pengajuan event ${submission.title} ditolak. ${submission.rejectionReason}`
          : status === "pending_review"
            ? `Pengajuan event ${submission.title} berhasil dikirim dan sedang ditinjau.`
            : `${config.message.replace("Pengajuan event", `Pengajuan event ${submission.title}`).replace("Event telah", `Event ${submission.title} telah`)}`;

        await query(
          `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
           VALUES ($1, $2, 'user', $3, $4, '/profil', FALSE)
           ON CONFLICT (id) DO NOTHING`,
          [notifId, userId, config.title, message]
        );
      }
    }
  }

  return getUserNotifications(userId, role);
}

/**
 * Membuat notifikasi untuk pengguna tertentu
 */
export async function createUserNotification(
  userId: string,
  title: string,
  message: string,
  href?: string
): Promise<void> {
  if (!userId) return;
  
  const notifId = `custom-${userId}-${Date.now()}`;
  await query(
    `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
     VALUES ($1, $2, 'user', $3, $4, $5, FALSE)
     ON CONFLICT (id) DO NOTHING`,
    [notifId, userId, title, message, href || '/profil']
  );
}
