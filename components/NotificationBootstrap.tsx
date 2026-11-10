"use client";

import { useEffect } from "react";
import { apiGetEvents } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { generateNotifications } from "@/lib/notifications";

export default function NotificationBootstrap() {
  const { user } = useAuth();
  const role = user?.role === "admin" ? "admin" : user?.role === "user" ? "user" : null;
  const userId = user?.id;

  useEffect(() => {
    if (!role || !userId) return;
    let active = true;
    const loadNotifications = async () => {
      try {
        const events = await apiGetEvents({ status: "Semua" });
        if (active) generateNotifications(events, role, userId);
      } catch (error) {
        console.error("Gagal melakukan preload notifikasi:", error);
      }
    };

    void loadNotifications();
    return () => {
      active = false;
    };
  }, [role, userId]);

  return null;
}
