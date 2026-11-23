import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { createUserNotification } from "@/lib/services/notification-service";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Payload request tidak valid." },
        { status: 400 }
      );
    }

    const { userId, title, message, href } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: "userId, title, dan message wajib diisi." },
        { status: 400 }
      );
    }

    await createUserNotification(userId, title, message, href);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API_CREATE_NOTIFICATION_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: "Gagal membuat notifikasi." },
      { status: 500 }
    );
  }
}