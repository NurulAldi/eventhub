import { NextRequest, NextResponse } from "next/server";
import { createInformation, getAllInformation } from "@/lib/services/information-service";

function role(request: NextRequest) {
  return request.headers.get("x-user-role") || "guest";
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const requestRole = role(request);
    const requestedStatus = params.get("status");
    const authorEmail = params.get("authorEmail");
    if (requestedStatus === "Semua" && requestRole !== "admin") {
      return NextResponse.json({ error: "Hanya admin yang dapat memantau seluruh pengajuan." }, { status: 403 });
    }
    if (authorEmail && (requestRole !== "user" || authorEmail !== request.headers.get("x-user-email"))) {
      return NextResponse.json({ error: "Akses daftar pengajuan ditolak." }, { status: 403 });
    }
    const items = await getAllInformation({
      category: params.get("category") || undefined,
      search: params.get("search") || undefined,
      status: requestedStatus || undefined,
      authorEmail: authorEmail || undefined,
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("[API_GET_INFORMATION_ERROR]:", error);
    return NextResponse.json({ error: "Gagal mengambil daftar informasi." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (role(request) !== "user") {
    return NextResponse.json({ error: "Hanya mahasiswa yang dapat mengajukan informasi." }, { status: 403 });
  }
  try {
    const body = await request.json();
    return NextResponse.json(await createInformation({ ...body, status: "pending_review" }), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengajukan informasi.";
    return NextResponse.json({ error: message }, { status: message.includes("wajib") ? 400 : 500 });
  }
}
