import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { hashPassword, setSession, type AuthUser } from "@/lib/auth";
import { registerSchema, formatZodError } from "@/lib/validations";
import { checkRateLimit, createRateLimitErrorResponse, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting: Maksimal 5 percobaan pendaftaran per menit per IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`auth:register:${clientIp}`, 5, 60_000);
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(rateLimit);
    }

    // 2. Validasi input menggunakan Zod
    const body = await request.json().catch(() => null);
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const { name, email, university, password } = validation.data;

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
