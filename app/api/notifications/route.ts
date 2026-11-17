import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/auth";
import {
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  syncUserNotifications,
} from "@/lib/services/notification-service";
import { NotificationRole } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const roleParam = request.nextUrl.searchParams.get("role");
    const role: NotificationRole = roleParam === "admin" && user.role === "admin" ? "admin" : "user";

    const notifications = await getUserNotifications(user.id, role);
    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error("[API_GET_NOTIFICATIONS_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: "Gagal mengambil notifikasi dari database." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const roleParam = request.nextUrl.searchParams.get("role");
    const role: NotificationRole = roleParam === "admin" && user.role === "admin" ? "admin" : "user";

    const synced = await syncUserNotifications(user.id, role);
    return NextResponse.json(synced, { status: 200 });
  } catch (error) {
    console.error("[API_POST_SYNC_NOTIFICATIONS_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: "Gagal menyinkronkan notifikasi dengan database." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => null);

    const role: NotificationRole = user.role === "admin" ? "admin" : "user";

    if (body?.all === true) {
      await markAllNotificationsRead(user.id, role);
      return NextResponse.json({ success: true, message: "Semua notifikasi telah ditandai dibaca." });
    }

    if (body?.id && typeof body.id === "string") {
      await markNotificationRead(user.id, body.id);
      return NextResponse.json({ success: true, id: body.id });
    }

    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  } catch (error) {
    console.error("[API_PATCH_NOTIFICATIONS_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: "Gagal memperbarui status notifikasi." },
      { status: 500 }
    );
  }
}
