import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { authErrorResponse, requireUser, type AuthUser } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Payload data tidak valid." }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : currentUser.name;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : currentUser.email;
    const university = typeof body.university === "string" ? body.university.trim() || null : currentUser.university || null;
    const avatarUrl =
      typeof body.avatarUrl === "string"
        ? body.avatarUrl.trim() || null
        : body.avatarUrl === null
        ? null
        : currentUser.avatarUrl || null;

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Nama lengkap minimal 2 karakter." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }

    // Periksa apakah email diubah dan sudah dipakai akun lain
    if (email !== currentUser.email) {
      const conflict = await queryOne<{ id: string }>(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, currentUser.id]
      );
      if (conflict) {
        return NextResponse.json({ error: "Email tersebut sudah digunakan oleh akun lain." }, { status: 409 });
      }
    }

    const updatedUser = await queryOne<AuthUser>(
      `UPDATE users
       SET name = $1,
           email = $2,
           avatar_url = $3,
           university = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, email, university, avatar_url AS "avatarUrl", role`,
      [name, email, avatarUrl, university, currentUser.id]
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "Gagal memperbarui profil pengguna." }, { status: 500 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("[API_USER_PROFILE_PATCH_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan profil." },
      { status: 500 }
    );
  }
}

