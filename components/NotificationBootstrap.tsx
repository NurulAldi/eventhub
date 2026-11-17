"use client";

import { useEffect } from "react";
import { apiGetEvents } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { generateNotifications, syncNotificationsWithServer } from "@/lib/notifications";
import { syncWishlistWithServer } from "@/lib/wishlist";
import { syncTicketsWithServer } from "@/lib/tickets";

export default function NotificationBootstrap() {
  const { user } = useAuth();
  const role = user?.role === "admin" ? "admin" : user?.role === "user" ? "user" : null;
  const userId = user?.id;

  useEffect(() => {
    if (!role || !userId) return;
    let active = true;
    const loadData = async () => {
      try {
        // Sync wishlist, tickets, and notifications with PostgreSQL server
        await Promise.allSettled([
          syncWishlistWithServer(userId),
          syncTicketsWithServer(userId),
          syncNotificationsWithServer(userId, role),
        ]);

        const events = await apiGetEvents({ status: "Semua" });
        if (active) generateNotifications(events, role, userId);
      } catch (error) {
        console.error("Gagal melakukan preload notifikasi:", error);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, [role, userId]);

  return null;
}
