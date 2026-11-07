import { NextRequest, NextResponse } from "next/server";
import { deleteInformation, getInformationById, updateInformation } from "@/lib/services/information-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const item = await getInformationById(id);
  return item ? NextResponse.json(item) : NextResponse.json({ error: "Informasi tidak ditemukan." }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const requestRole = request.headers.get("x-user-role");
  if (requestRole !== "user" && requestRole !== "admin") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const current = await getInformationById(id);
    if (!current) return NextResponse.json({ error: "Informasi tidak ditemukan." }, { status: 404 });
    if (requestRole === "user" && current.authorEmail && current.authorEmail !== body.authorEmail) {
      return NextResponse.json({ error: "Anda hanya dapat mengubah pengajuan sendiri." }, { status: 403 });
    }
    if (requestRole === "user") body.status = "pending_review";
    return NextResponse.json(await updateInformation(id, body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui informasi.";
    return NextResponse.json({ error: message }, { status: message.includes("wajib") ? 400 : 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const requestRole = request.headers.get("x-user-role");
  if (requestRole !== "admin" && requestRole !== "user") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  if (requestRole === "user") {
    const current = await getInformationById(id);
    if (!current) return NextResponse.json({ error: "Informasi tidak ditemukan." }, { status: 404 });
    if (!current.authorEmail || current.authorEmail !== request.headers.get("x-user-email")) {
      return NextResponse.json({ error: "Anda hanya dapat menghapus pengajuan sendiri." }, { status: 403 });
    }
  }
  return NextResponse.json({ success: await deleteInformation(id) });
}
