/**
 * REST API Route Handler: /api/events
 * Mendukung GET (mengambil semua event dengan filter) dan POST (membuat event baru)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllEvents, createEvent, EventFilters } from "@/lib/services/event-service";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { createEventSchema, formatZodError } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const filters: EventFilters = {
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      price: (searchParams.get("price") as EventFilters["price"]) || undefined,
      location: (searchParams.get("location") as EventFilters["location"]) || undefined,
      status: searchParams.get("status") || undefined,
      sortBy: (searchParams.get("sortBy") as EventFilters["sortBy"]) || undefined,
    };

    const events = await getAllEvents(filters);

    return NextResponse.json(events, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("[API_GET_EVENTS_ERROR]:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil daftar event dari database.",
        message: error instanceof Error ? error.message : "Terjadi kesalahan internal pada server.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role !== "user") {
      return NextResponse.json(
        { error: "Pengajuan event hanya dapat dilakukan oleh user biasa." },
        { status: 403 }
      );
    }
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Payload request tidak valid." },
        { status: 400 }
      );
    }

    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const newEvent = await createEvent(validation.data, user.id);

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("[API_POST_EVENT_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan event.";
    const isValidationError =
      errorMessage.includes("wajib") ||
      errorMessage.includes("harus") ||
      errorMessage.includes("karakter");

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
