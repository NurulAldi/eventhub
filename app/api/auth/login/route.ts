import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { setSession, verifyPassword, type AuthUser } from "@/lib/auth";

interface LoginRow extends AuthUser {
  password_hash: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
    }

    const user = await queryOne<LoginRow>(
      `SELECT id, name, email, university, avatar_url AS "avatarUrl", role, password_hash
       FROM users
       WHERE email = $1 AND is_active = TRUE`,
      [email]
    );

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
    }

    await setSession(user.id);
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      university: user.university,
      avatarUrl: user.avatarUrl || null,
      role: user.role,
    });
  } catch (error) {
    console.error("[API_AUTH_LOGIN_ERROR]:", error);
    return NextResponse.json({ error: "Login gagal diproses." }, { status: 500 });
  }
}
