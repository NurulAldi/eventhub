"use client";

import { useEffect } from "react";
import { apiGetEvents } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { generateNotifications } from "@/lib/notifications";

export default function NotificationBootstrap() {
  const { user } = useAuth();
  const role = user?.role === "admin" ? "admin" : user?.role === "user" ? "user" : null;

  useEffect(() => {
    if (!role) return;
    let active = true;
    const loadNotifications = async () => {
      try {
        const events = await apiGetEvents({ status: "Semua" });
        if (active) generateNotifications(events, role);
      } catch (error) {
        console.error("Gagal melakukan preload notifikasi:", error);
      }
    };

    void loadNotifications();
    return () => {
      active = false;
    };
  }, [role]);

  return null;
}
