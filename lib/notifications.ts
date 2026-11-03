import type { Event } from "@/types";
import { getWishlistIds } from "@/lib/wishlist";
import { getSubmittedEvents, saveSubmittedEvent } from "@/lib/submissions";

export type NotificationRole = "user" | "admin";
export type ReminderTrigger = "7d" | "3d" | "1d" | "1h";

export interface AppNotification {
  id: string;
  role: NotificationRole;
  title: string;
  message: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

const notificationsKey = "eventhub_notifications";
const reminderPreferencesKey = "eventhub_reminder_preferences";
const notificationChangeEvent = "eventhub-notification-change";

export function readNotifications(): AppNotification[] {
  try {
    const value = JSON.parse(localStorage.getItem(notificationsKey) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeNotifications(notifications: AppNotification[]) {
  localStorage.setItem(notificationsKey, JSON.stringify(notifications));
  window.dispatchEvent(new Event(notificationChangeEvent));
}

export function addNotification(notification: Omit<AppNotification, "createdAt" | "read">) {
  const notifications = readNotifications();
  if (notifications.some((item) => item.id === notification.id)) return;
  writeNotifications([
    { ...notification, createdAt: new Date().toISOString(), read: false },
    ...notifications,
  ].slice(0, 100));
}

export function getReminderPreferences(): Record<string, ReminderTrigger> {
  try {
    const value = JSON.parse(localStorage.getItem(reminderPreferencesKey) || "{}");
    return value && typeof value === "object" ? value as Record<string, ReminderTrigger> : {};
  } catch {
    return {};
  }
}

export function setReminderPreference(eventId: string, trigger: ReminderTrigger | null) {
  const preferences = getReminderPreferences();
  if (trigger) preferences[eventId] = trigger;
  else delete preferences[eventId];
  localStorage.setItem(reminderPreferencesKey, JSON.stringify(preferences));
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

export function getUnreadCount(role: NotificationRole) {
  return readNotifications().filter((item) => item.role === role && !item.read).length;
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

export function markNotificationRead(id: string) {
  writeNotifications(readNotifications().map((item) => item.id === id ? { ...item, read: true } : item));
}

export function markAllNotificationsRead(role: NotificationRole) {
  writeNotifications(readNotifications().map((item) => item.role === role ? { ...item, read: true } : item));
}

function daysUntil(date: string) {
  const target = new Date(`${date}T23:59:59`);
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
}

export function generateNotifications(events: Event[], role: NotificationRole) {
  if (role === "admin") {
    events.filter((event) => event.status === "pending_review").forEach((event) => {
      addNotification({
        id: `admin-submission-${event.id}-${event.status}-${event.updatedAt || "pending"}`,
        role,
        title: "Pengajuan baru",
        message: `Pengajuan event ${event.title} telah dikirim atau diperbarui dan menunggu review.`,
        href: "/dashboard",
      });
    });
    return;
  }

  const wishlistIds = new Set(getWishlistIds());
  const preferences = getReminderPreferences();
  events.filter((event) => wishlistIds.has(event.id)).forEach((event) => {
    if (event.status === "cancelled") {
      addNotification({
        id: `cancelled-${event.id}`,
        role,
        title: "Event dibatalkan",
        message: `Event ${event.title} telah dibatalkan oleh penyelenggara.`,
        href: `/event/${event.id}`,
      });
    }
    const trigger = preferences[event.id];
    if (!trigger || !event.registrationDeadline) return;
    const remaining = daysUntil(event.registrationDeadline);
    const triggerDays = trigger === "7d" ? 7 : trigger === "3d" ? 3 : trigger === "1d" ? 1 : 0;
    if (trigger === "1h" || remaining <= triggerDays) {
      addNotification({
        id: `deadline-${event.id}-${trigger}-${event.registrationDeadline}`,
        role,
        title: "Deadline event hampir berakhir",
        message: `Pendaftaran ${event.title} akan ditutup pada ${event.registrationDeadline}. Sisa waktu: ${Math.max(remaining, 0)} hari.`,
        href: `/event/${event.id}`,
      });
    }
    if (daysUntil(event.date) === 1) {
      addNotification({
        id: `saved-tomorrow-${event.id}-${event.date}`,
        role,
        title: "Event tersimpan dimulai besok",
        message: `Event ${event.title} yang Anda simpan akan dimulai besok.`,
        href: `/event/${event.id}`,
      });
    }
    const percentage = event.quota ? Math.round(((event.registeredCount || 0) / event.quota) * 100) : 0;
    if (percentage >= 90 && percentage < 100) {
      addNotification({
        id: `quota-${event.id}-${percentage}`,
        role,
        title: "Kuota hampir penuh",
        message: `Kuota ${event.title} telah terisi ${percentage}%.`,
        href: `/event/${event.id}`,
      });
    }
  });

  getSubmittedEvents().forEach((submission) => {
    const latestSubmission = events.find((event) => event.id === submission.id) || submission;
    if (latestSubmission.id !== submission.id) return;
    if (latestSubmission.status !== submission.status) saveSubmittedEvent(latestSubmission);

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

    addNotification({
      id: `submission-${latestSubmission.id}-${status}`,
      role,
      ...notification,
      href: "/profil",
    });
  });
}
