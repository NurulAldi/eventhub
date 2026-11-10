import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { hashPassword, setSession, type AuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const university = typeof body?.university === "string" ? body.university.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (name.length < 2 || !email || !university || password.length < 8) {
      return NextResponse.json(
        { error: "Nama, email, universitas user, dan kata sandi minimal 8 karakter wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await queryOne<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]);
    if (existing) {
      return NextResponse.json({ error: "Email tersebut sudah terdaftar." }, { status: 409 });
    }

    const user = await queryOne<AuthUser>(
      `INSERT INTO users (name, email, university, password_hash, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, name, email, university, avatar_url AS "avatarUrl", role`,
      [name, email, university, await hashPassword(password)]
    );

    if (!user) {
      return NextResponse.json({ error: "Akun gagal dibuat." }, { status: 500 });
    }

    await setSession(user.id);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[API_AUTH_REGISTER_ERROR]:", error);
    return NextResponse.json({ error: "Registrasi gagal diproses." }, { status: 500 });
  }
}
