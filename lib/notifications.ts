import type { Event } from "@/types";
import { getWishlistIds } from "@/lib/wishlist";
import { getSubmittedEvents, saveSubmittedEvent } from "@/lib/submissions";

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

function getNotificationsKey(userId: string): string {
  return `eventhub_notifications_${userId}`;
}

function getReminderPreferencesKey(userId: string): string {
  return `eventhub_reminder_preferences_${userId}`;
}

export function readNotifications(userId: string): AppNotification[] {
  try {
    const value = JSON.parse(localStorage.getItem(getNotificationsKey(userId)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeNotifications(userId: string, notifications: AppNotification[]) {
  localStorage.setItem(getNotificationsKey(userId), JSON.stringify(notifications));
  window.dispatchEvent(new Event(notificationChangeEvent));
}

export function addNotification(userId: string, notification: Omit<AppNotification, "createdAt" | "read">) {
  const notifications = readNotifications(userId);
  if (notifications.some((item) => item.id === notification.id)) return;
  writeNotifications(userId, [
    { ...notification, createdAt: new Date().toISOString(), read: false },
    ...notifications,
  ].slice(0, 100));
}

export function getReminderPreferences(userId: string): Record<string, ReminderTrigger> {
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
  const preferences = getReminderPreferences(userId);
  if (trigger) preferences[eventId] = trigger;
  else delete preferences[eventId];
  localStorage.setItem(getReminderPreferencesKey(userId), JSON.stringify(preferences));
  window.dispatchEvent(new Event(notificationChangeEvent));
}

export function subscribeToNotifications(listener: () => void) {
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
}

export function markAllNotificationsRead(userId: string, role: NotificationRole) {
  writeNotifications(userId, readNotifications(userId).map((item) => item.role === role ? { ...item, read: true } : item));
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
        id: `admin-submission-${event.id}-${event.status}-${event.updatedAt || "pending"}`,
        role,
        title: "Pengajuan baru",
        message: `Pengajuan event ${event.title} telah dikirim atau diperbarui dan menunggu review.`,
        href: `/event/${event.id}`,
      });
    });
    return;
  }

  const wishlistIds = new Set(getWishlistIds(userId));
  const preferences = getReminderPreferences(userId);
  events.filter((event) => wishlistIds.has(event.id)).forEach((event) => {
    if (event.status === "cancelled") {
      addNotification(userId, {
        id: `cancelled-${event.id}`,
        role,
        title: "Event dibatalkan",
        message: `Event ${event.title} telah dibatalkan oleh penyelenggara.`,
        href: `/event/${event.id}`,
      });
    }
    const trigger = preferences[event.id];
    if (!trigger) return;
    const remaining = daysUntil(event.date);
    const triggerDays = trigger === "7d" ? 7 : trigger === "3d" ? 3 : 1;
    if (remaining <= triggerDays && remaining >= 0) {
      addNotification(userId, {
        id: `reminder-${event.id}-${trigger}-${event.date}`,
        role,
        title: "Pengingat event",
        message: `Event ${event.title} akan dimulai pada ${event.date}. Sisa waktu: ${remaining} hari.`,
        href: `/event/${event.id}`,
      });
    }
    if (daysUntil(event.date) === 1) {
      addNotification(userId, {
        id: `saved-tomorrow-${event.id}-${event.date}`,
        role,
        title: "Event tersimpan dimulai besok",
        message: `Event ${event.title} yang Anda simpan akan dimulai besok.`,
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

  getSubmittedEvents(userId).forEach((submission) => {
    const latestSubmission = events.find((event) => event.id === submission.id) || submission;
    if (latestSubmission.id !== submission.id) return;
    if (latestSubmission.status !== submission.status) saveSubmittedEvent(userId, latestSubmission);

    const status = latestSubmission.status || "pending_review";
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
  });
}
