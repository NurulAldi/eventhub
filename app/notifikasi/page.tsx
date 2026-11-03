"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGetEvents } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  AppNotification,
  generateNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  readNotifications,
  subscribeToNotifications,
  formatNotificationTime,
} from "@/lib/notifications";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const role = user?.role === "admin" ? "admin" : user?.role === "user" ? "user" : null;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!role) {
      router.replace("/login");
      return;
    }
    const authenticatedRole = role;
    let mounted = true;
    const refresh = () => setNotifications(readNotifications().filter((item) => item.role === authenticatedRole));
    async function load() {
      const events = await apiGetEvents({ status: "Semua" });
      generateNotifications(events, authenticatedRole);
      if (mounted) refresh();
    }
    void load().catch((error) => console.error("Gagal memuat notifikasi:", error));
    const unsubscribe = subscribeToNotifications(refresh);
    const initialTimeTimer = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => {
      mounted = false;
      window.clearTimeout(initialTimeTimer);
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [role, router]);

  if (!role) return null;

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-6 lg:px-16 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Notifikasi</h1>
          <p className="mt-1 text-sm text-gray-500">Informasi penting berdasarkan aktivitas dan pengingat Anda.</p>
        </div>
        <button type="button" onClick={() => { markAllNotificationsRead(role); setNotifications(readNotifications().filter((item) => item.role === role)); }} className="text-xs font-semibold underline">
          Tandai semua dibaca
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {notifications.length === 0 && <div className="p-8 text-center bg-white border border-gray-200 rounded-xl text-sm text-gray-500">Belum ada notifikasi.</div>}
        {notifications.map((notification) => (
          <div key={notification.id} className={`p-4 rounded-xl border ${notification.read ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-sm text-gray-900">{notification.title}</h2>
                <time dateTime={notification.createdAt} className="mt-1 block text-[11px] text-gray-400">
                  {formatNotificationTime(notification.createdAt, currentTime)}
                </time>
                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                {notification.href && <Link href={notification.href} onClick={() => markNotificationRead(notification.id)} className="inline-block mt-2 text-xs font-semibold underline">Lihat detail</Link>}
              </div>
              {!notification.read && <button type="button" onClick={() => { markNotificationRead(notification.id); setNotifications(readNotifications().filter((item) => item.role === role)); }} className="text-[11px] font-semibold text-blue-700">Tandai dibaca</button>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
