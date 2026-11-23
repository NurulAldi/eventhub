import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { getEventRegistrations } from "@/lib/services/registration-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Parameter ID event tidak valid." },
        { status: 400 }
      );
    }

    // Verify user is the event creator or admin
    const { getEventById } = await import("@/lib/services/event-service");
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json(
        { error: `Event dengan ID '${id}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    const isCreator = Boolean(
      event.createdBy === user.id ||
      event.organizer.trim().toLowerCase() === user.name.trim().toLowerCase()
    );

    if (!isCreator && user.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya penyelenggara event yang dapat melihat daftar pendaftar." },
        { status: 403 }
      );
    }

    const registrations = await getEventRegistrations(id);

    return NextResponse.json(registrations, { status: 200 });
  } catch (error) {
    console.error("[API_GET_EVENT_REGISTRATIONS_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: "Gagal mengambil daftar pendaftar event." },
      { status: 500 }
    );
  }
}