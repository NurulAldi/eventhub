import type { Event } from "@/types";
import { getWishlistIds } from "@/lib/wishlist";
import { getSubmittedEvents, saveSubmittedEvent } from "@/lib/submissions";
import { getRegisteredTickets } from "@/lib/tickets";
import { getCalendarDaysDiff } from "@/lib/event-lifecycle";
import {
  apiGetNotificationPreferences,
  apiUpdateNotificationPreferences,
  apiGetNotifications,
  apiSyncNotifications,
  apiMarkNotificationRead,
  apiMarkAllNotificationsRead,
} from "./api";

export type NotificationRole = "user" | "admin";
export type ReminderTrigger = "7d" | "3d" | "1d";

export interface AppNotification {
  id: string;
  role: NotificationRole;
  title: string;
  message: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

const notificationChangeEvent = "eventhub-notification-change";
const MAX_NOTIFICATIONS = 100;

function getNotificationsKey(userId: string): string {
  return `eventhub_notifications_${userId}`;
}

function getReminderPreferencesKey(userId: string): string {
  return `eventhub_reminder_preferences_${userId}`;
}

export function readNotifications(userId: string): AppNotification[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const value = JSON.parse(localStorage.getItem(getNotificationsKey(userId)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeNotifications(userId: string, notifications: AppNotification[]) {
  if (typeof window === "undefined" || !userId) return;
  localStorage.setItem(getNotificationsKey(userId), JSON.stringify(notifications));
  window.dispatchEvent(new Event(notificationChangeEvent));
}

export function addNotification(userId: string, notification: Omit<AppNotification, "createdAt" | "read">) {
  const notifications = readNotifications(userId);
  if (notifications.some((item) => item.id === notification.id)) return;
  writeNotifications(userId, [
    { ...notification, createdAt: new Date().toISOString(), read: false },
    ...notifications,
  ].slice(0, MAX_NOTIFICATIONS));
}

export function getReminderPreferences(userId: string): Record<string, ReminderTrigger> {
  if (typeof window === "undefined" || !userId) return {};
  try {
    const value = JSON.parse(localStorage.getItem(getReminderPreferencesKey(userId)) || "{}");
    if (!value || typeof value !== "object") return {};
    const validTriggers: Record<string, ReminderTrigger> = {};
    Object.entries(value).forEach(([eventId, trigger]) => {
      if (trigger === "7d" || trigger === "3d" || trigger === "1d") {
        validTriggers[eventId] = trigger;
      }
    });
    return validTriggers;
  } catch {
    return {};
  }
}

export function setReminderPreference(userId: string, eventId: string, trigger: ReminderTrigger | null) {
  if (!userId || !eventId) return;
  const preferences = getReminderPreferences(userId);
  if (trigger) preferences[eventId] = trigger;
  else delete preferences[eventId];

  localStorage.setItem(getReminderPreferencesKey(userId), JSON.stringify(preferences));
  window.dispatchEvent(new Event(notificationChangeEvent));

  // Persist ke server
  void apiUpdateNotificationPreferences({
    eventReminders: preferences,
  }).catch((err) => {
    console.error("Gagal menyimpan preferensi pengingat ke database:", err);
  });
}

/**
 * Sinkronisasi notifikasi dan preferensi dari PostgreSQL
 */
function getNotifiedSubmissionsKey(userId: string): string {
  return `eventhub_notified_submissions_${userId}`;
}

export function getNotifiedSubmissionStatuses(userId: string): Record<string, string> {
  if (typeof window === "undefined" || !userId) return {};
  try {
    const value = JSON.parse(localStorage.getItem(getNotifiedSubmissionsKey(userId)) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function saveNotifiedSubmissionStatus(userId: string, eventId: string, status: string) {
  if (typeof window === "undefined" || !userId || !eventId) return;
  const current = getNotifiedSubmissionStatuses(userId);
  current[eventId] = status;
  localStorage.setItem(getNotifiedSubmissionsKey(userId), JSON.stringify(current));
}

export async function syncNotificationsWithServer(userId: string, role: NotificationRole): Promise<void> {
  if (!userId) return;
  try {
    const [prefs, notifs] = await Promise.all([
      apiGetNotificationPreferences().catch(() => null),
      apiSyncNotifications(role).catch(() => apiGetNotifications(role).catch(() => [])),
    ]);

    if (prefs && prefs.eventReminders) {
      localStorage.setItem(getReminderPreferencesKey(userId), JSON.stringify(prefs.eventReminders));
    }
    if (Array.isArray(notifs)) {
      const localNotifs = readNotifications(userId);

      // Pertahankan status 'read' jika di lokal pengguna sudah menandai dibaca
      const mergedServerNotifs = notifs.map((n) => {
        const local = localNotifs.find((l) => l.id === n.id);
        return local?.read ? { ...n, read: true } : n;
      });

      // Server adalah sumber kebenaran untuk notifikasi yang sudah tersimpan di
      // PostgreSQL. Notifikasi lokal hanya dipertahankan jika server memang belum
      // punya notifikasi untuk role ini, agar notifikasi yang sudah dibersihkan di
      // server tidak muncul kembali sebagai duplikat.
      const combined = mergedServerNotifs.length > 0
        ? mergedServerNotifs
        : [...mergedServerNotifs, ...localNotifs].slice(0, MAX_NOTIFICATIONS);

      writeNotifications(userId, combined.slice(0, MAX_NOTIFICATIONS));
    }
  } catch (error) {
    console.error("Gagal sinkronisasi notifikasi dengan server:", error);
  }
}

export function subscribeToNotifications(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", listener);
  window.addEventListener(notificationChangeEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(notificationChangeEvent, listener);
  };
}

export function getUnreadCount(userId: string, role: NotificationRole) {
  return readNotifications(userId).filter((item) => item.role === role && !item.read).length;
}

export function formatNotificationTime(createdAt: string, now = Date.now()): string {
  const createdTime = new Date(createdAt).getTime();
  if (!Number.isFinite(createdTime)) return "Waktu tidak diketahui";

  const elapsedSeconds = Math.max(0, Math.floor((now - createdTime) / 1000));
  if (elapsedSeconds < 60) return "Baru saja";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} menit lalu`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)} jam lalu`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)} hari lalu`;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdTime));
}

export function markNotificationRead(userId: string, id: string) {
  writeNotifications(userId, readNotifications(userId).map((item) => item.id === id ? { ...item, read: true } : item));
  void apiMarkNotificationRead(id).catch((err) => {
    console.error("Gagal menandai notifikasi dibaca di server:", err);
  });
}

export function markAllNotificationsRead(userId: string, role: NotificationRole) {
  writeNotifications(userId, readNotifications(userId).map((item) => item.role === role ? { ...item, read: true } : item));
  void apiMarkAllNotificationsRead().catch((err) => {
    console.error("Gagal menandai semua notifikasi dibaca di server:", err);
  });
}

function daysUntil(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return Number.NaN;

  const targetDay = Date.UTC(year, month - 1, day);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((targetDay - today) / 86400000);
}

export function generateNotifications(events: Event[], role: NotificationRole, userId: string) {
  if (role === "admin") {
    events.filter((event) => event.status === "pending_review").forEach((event) => {
      addNotification(userId, {
        id: `admin-submission-${event.id}`,
        role,
        title: "Pengajuan baru",
        message: `Pengajuan event ${event.title} telah dikirim atau diperbarui dan menunggu review.`,
        href: `/event/${event.id}`,
      });
    });
    return;
  }

  const wishlistIds = new Set(getWishlistIds(userId));
  const registeredEventIds = new Set(getRegisteredTickets(userId).map((t) => t.eventId));

  events.filter((event) => wishlistIds.has(event.id) || registeredEventIds.has(event.id)).forEach((event) => {
    if (event.status === "cancelled") {
      addNotification(userId, {
        id: `cancelled-${event.id}`,
        role,
        title: "Event dibatalkan",
        message: `Event ${event.title} telah dibatalkan oleh penyelenggara.`,
        href: `/event/${event.id}`,
      });
      return;
    }
    if (event.status === "rejected") return;

    const deadlineDays = getCalendarDaysDiff(event.registrationDeadline);
    const eventDays = getCalendarDaysDiff(event.date);

    // H-1 deadline pendaftaran
    if (deadlineDays === 1) {
      addNotification(userId, {
        id: `reminder-deadline-h-1-${event.id}-${event.registrationDeadline}`,
        role,
        title: "H-1 Deadline Pendaftaran",
        message: `Pendaftaran untuk event ${event.title} akan ditutup besok (${event.registrationDeadline}). Jangan sampai ketinggalan!`,
        href: `/event/${event.id}`,
      });
    }

    // H-1 pelaksanaan event
    if (eventDays === 1) {
      addNotification(userId, {
        id: `reminder-event-h-1-${event.id}-${event.date}`,
        role,
        title: "H-1 Tanggal Pelaksanaan",
        message: `Event ${event.title} akan dilaksanakan besok (${event.date}). Siapkan diri Anda!`,
        href: `/event/${event.id}`,
      });
    }

    // Hari H pelaksanaan event
    if (eventDays === 0) {
      addNotification(userId, {
        id: `reminder-event-today-${event.id}-${event.date}`,
        role,
        title: "Event Berlangsung Hari Ini",
        message: `Event ${event.title} berlangsung hari ini! Selamat mengikuti acara.`,
        href: `/event/${event.id}`,
      });
    }

    const percentage = event.quota ? Math.round(((event.registeredCount || 0) / event.quota) * 100) : 0;
    if (percentage >= 90 && percentage < 100) {
      addNotification(userId, {
        id: `quota-${event.id}-${percentage}`,
        role,
        title: "Kuota hampir penuh",
        message: `Kuota ${event.title} telah terisi ${percentage}%.`,
        href: `/event/${event.id}`,
      });
    }
  });

  const notifiedStatuses = getNotifiedSubmissionStatuses(userId);

  getSubmittedEvents(userId).forEach((submission) => {
    const latestSubmission = events.find((event) => event.id === submission.id) || submission;
    if (latestSubmission.id !== submission.id) return;
    if (latestSubmission.status !== submission.status) saveSubmittedEvent(userId, latestSubmission);

    const status = latestSubmission.status || "pending_review";
    // Jika status pengajuan belum berubah dari yang sudah pernah dinotifikasikan, jangan buat notifikasi baru
    if (notifiedStatuses[latestSubmission.id] === status) {
      return;
    }

    const statusNotification: Record<string, { title: string; message: string }> = {
      pending_review: {
        title: "Pengajuan event diterima",
        message: `Pengajuan event ${latestSubmission.title} berhasil dikirim dan sedang ditinjau.`,
      },
      needs_revision: {
        title: "Event perlu diperbaiki",
        message: `Pengajuan event ${latestSubmission.title} perlu dilengkapi sebelum dapat dipublikasikan.`,
      },
      rejected: {
        title: "Event ditolak",
        message: `Pengajuan event ${latestSubmission.title} ditolak. ${latestSubmission.rejectionReason || "Lihat alasan penolakan."}`,
      },
      active: {
        title: "Event disetujui",
        message: `Event ${latestSubmission.title} telah disetujui dan sekarang tampil di EventHub Kampus.`,
      },
      completed: {
        title: "Event selesai",
        message: `Event ${latestSubmission.title} telah berstatus selesai.`,
      },
      cancelled: {
        title: "Event dibatalkan",
        message: `Event ${latestSubmission.title} telah dibatalkan oleh penyelenggara.`,
      },
    };
    const notification = statusNotification[status];
    if (!notification) return;

    addNotification(userId, {
      id: `submission-${latestSubmission.id}-${status}`,
      role,
      ...notification,
      href: "/profil",
    });

    // Simpan status yang telah dinotifikasikan agar tidak muncul berulang kali setiap membuka notifikasi
    saveNotifiedSubmissionStatus(userId, latestSubmission.id, status);
  });
}
