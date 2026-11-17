/**
 * REST API Route Handler: /api/events/[id]
 * Mendukung GET (detail event), PUT/PATCH (update event), dan DELETE (hapus event)
 */

import { NextRequest, NextResponse } from "next/server";
import { getEventById, updateEvent, deleteEvent, type CreateEventDTO } from "@/lib/services/event-service";
import { registerUserForEvent, RegistrationError } from "@/lib/services/registration-service";
import { authErrorResponse, requireAdmin, requireUser } from "@/lib/auth";
import { updateEventSchema, registerTicketSchema, formatZodError } from "@/lib/validations";

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
    const user = await requireUser();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Parameter ID event tidak valid." },
        { status: 400 }
      );
    }

    const rawBody = await request.json().catch(() => null);

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { error: "Payload request tidak valid." },
        { status: 400 }
      );
    }

    const validation = updateEventSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const body = validation.data;

    if (user.role === "user") {
      const existing = await getEventById(id);
      if (!existing || existing.organizer.trim().toLowerCase() !== user.name.trim().toLowerCase()) {
        return NextResponse.json(
          { error: "Anda hanya dapat mengubah pengajuan event milik sendiri." },
          { status: 403 }
        );
      }
    }

    const updated = await updateEvent(id, body as Partial<CreateEventDTO>);

    if (!updated) {
      return NextResponse.json(
        { error: `Event dengan ID '${id}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("[API_PATCH_EVENT_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui event.";
    const isValidationError =
      errorMessage.includes("wajib") ||
      errorMessage.includes("harus") ||
      errorMessage.includes("karakter") ||
      errorMessage.includes("tidak dapat diedit");

    return NextResponse.json(
      { error: errorMessage },
      { status: isValidationError ? 400 : 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Parameter ID event tidak valid." }, { status: 400 });
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Akun dengan role admin tidak dapat mendaftar event." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const validation = registerTicketSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const result = await registerUserForEvent(user.id, id);
    return NextResponse.json(
      {
        ...result.event,
        ticket: result.ticket,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API_REGISTER_EVENT_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    if (error instanceof RegistrationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mendaftarkan peserta." },
      { status: 500 }
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
    await requireAdmin();
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
    const authError = authErrorResponse(error);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });
    return NextResponse.json(
      {
        error: "Gagal menghapus event dari database.",
        message: error instanceof Error ? error.message : "Terjadi kesalahan internal.",
      },
      { status: 500 }
    );
  }
}
