import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/auth";

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "event-images";

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Konfigurasi Supabase Storage belum tersedia di server." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Berkas gambar wajib dipilih." }, { status: 400 });
    }
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Format gambar harus JPG, PNG, WEBP, atau GIF." }, { status: 400 });
    }
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "Ukuran gambar maksimal 5 MB." }, { status: 400 });
    }

    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const objectPath = `events/${crypto.randomUUID()}.${extension}`;
    const uploadResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${bucket}/${objectPath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": file.type,
          "x-upsert": "false",
        },
        body: await file.arrayBuffer(),
      }
    );

    if (!uploadResponse.ok) {
      const responseText = await uploadResponse.text();
      console.error("[API_UPLOAD_IMAGE_ERROR]:", responseText);
      return NextResponse.json({ error: "Gagal mengunggah gambar ke Supabase Storage." }, { status: 502 });
    }

    return NextResponse.json({
      url: `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${objectPath}`,
    });
  } catch (error) {
    console.error("[API_UPLOAD_IMAGE_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memproses upload gambar." },
      { status: 500 }
    );
  }
}
