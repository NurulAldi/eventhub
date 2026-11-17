import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/auth";
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "@/lib/services/notification-service";
import { notificationPreferencesSchema, formatZodError } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireUser();
    const preferences = await getUserNotificationPreferences(user.id);
    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
    console.error("[API_GET_USER_PREFERENCES_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: "Gagal mengambil preferensi notifikasi dari database." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const rawBody = await request.json().catch(() => null);

    const validation = notificationPreferencesSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const payload: Parameters<typeof updateUserNotificationPreferences>[1] = {};
    if (validation.data.reminderEvent !== undefined) payload.reminderEvent = validation.data.reminderEvent;
    if (validation.data.updateEvent !== undefined) payload.updateEvent = validation.data.updateEvent;
    if (validation.data.generalInfo !== undefined) payload.generalInfo = validation.data.generalInfo;
    if (validation.data.eventReminders !== undefined) {
      const reminders: Record<string, "7d" | "3d" | "1d"> = {};
      for (const [k, v] of Object.entries(validation.data.eventReminders)) {
        if (v === "7d" || v === "3d" || v === "1d") {
          reminders[k] = v;
        }
      }
      payload.eventReminders = reminders;
    }

    const updated = await updateUserNotificationPreferences(user.id, payload);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("[API_PATCH_USER_PREFERENCES_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memperbarui preferensi notifikasi." },
      { status: 500 }
    );
  }
}
