/**
 * REST API Route Handler: /api/events/[id]
 * Mendukung GET (detail event), PUT/PATCH (update event), dan DELETE (hapus event)
 */

import { NextRequest, NextResponse } from "next/server";
import { getEventById, updateEvent, deleteEvent } from "@/lib/services/event-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Parameter ID event tidak valid." },
        { status: 400 }
      );
    }

    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json(
        { error: `Event dengan ID '${id}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error("[API_GET_EVENT_BY_ID_ERROR]:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil detail event dari database.",
        message: error instanceof Error ? error.message : "Terjadi kesalahan internal.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Parameter ID event tidak valid." },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Payload request tidak valid." },
        { status: 400 }
      );
    }

    const updated = await updateEvent(id, body);

    if (!updated) {
      return NextResponse.json(
        { error: `Event dengan ID '${id}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("[API_PATCH_EVENT_ERROR]:", error);

    const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui event.";
    const isValidationError =
      errorMessage.includes("wajib") ||
      errorMessage.includes("harus") ||
      errorMessage.includes("karakter");

    return NextResponse.json(
      { error: errorMessage },
      { status: isValidationError ? 400 : 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  return PATCH(request, context);
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Parameter ID event tidak valid." },
        { status: 400 }
      );
    }

    const deleted = await deleteEvent(id);

    if (!deleted) {
      return NextResponse.json(
        { error: `Event dengan ID '${id}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Event dengan ID '${id}' berhasil dihapus.`,
        id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API_DELETE_EVENT_ERROR]:", error);
    return NextResponse.json(
      {
        error: "Gagal menghapus event dari database.",
        message: error instanceof Error ? error.message : "Terjadi kesalahan internal.",
      },
      { status: 500 }
    );
  }
}
