import { query, queryOne } from "@/lib/db";
import { AppNotification, NotificationRole, ReminderTrigger } from "@/lib/notifications";
import { getAllEvents } from "./event-service";
import { getUserWishlistEventIds } from "./wishlist-service";

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
    // Notifikasi pengajuan event untuk admin
    for (const event of allEvents) {
      if (event.status === "pending_review") {
        const notifId = `admin-submission-${event.id}-${event.status}-${event.updatedAt || "pending"}`;
        await query(
          `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
           VALUES ($1, $2, 'admin', 'Pengajuan baru', $3, $4, FALSE)
           ON CONFLICT (id) DO NOTHING`,
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

    for (const event of allEvents) {
      // 1. Notifikasi pembatalan event (kategori update event)
      if (prefs.updateEvent && wishlistIds.has(event.id) && event.status === "cancelled") {
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

      // 2. Notifikasi reminder event tersimpan (kategori reminder event)
      if (prefs.reminderEvent && wishlistIds.has(event.id)) {
        const trigger = prefs.eventReminders[event.id];
        if (trigger) {
          const remaining = daysUntil(event.date);
          const triggerDays = trigger === "7d" ? 7 : trigger === "3d" ? 3 : 1;
          if (remaining <= triggerDays && remaining >= 0) {
            const notifId = `reminder-${event.id}-${trigger}-${event.date}`;
            await query(
              `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
               VALUES ($1, $2, 'user', 'Pengingat event', $3, $4, FALSE)
               ON CONFLICT (id) DO NOTHING`,
              [
                notifId,
                userId,
                `Event ${event.title} akan dimulai pada ${event.date}. Sisa waktu: ${remaining} hari.`,
                `/event/${event.id}`,
              ]
            );
          }
        }

        // Reminder 1 hari sebelumnya
        if (daysUntil(event.date) === 1) {
          const notifId = `saved-tomorrow-${event.id}-${event.date}`;
          await query(
            `INSERT INTO user_notifications (id, user_id, role, title, message, href, read)
             VALUES ($1, $2, 'user', 'Event tersimpan dimulai besok', $3, $4, FALSE)
             ON CONFLICT (id) DO NOTHING`,
            [
              notifId,
              userId,
              `Event ${event.title} yang Anda simpan akan dimulai besok.`,
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
  }

  return getUserNotifications(userId, role);
}
