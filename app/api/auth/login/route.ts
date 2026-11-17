import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { setSession, verifyPassword, type AuthUser } from "@/lib/auth";
import { loginSchema, formatZodError } from "@/lib/validations";
import { checkRateLimit, createRateLimitErrorResponse, getClientIp } from "@/lib/rate-limit";

interface LoginRow extends AuthUser {
  password_hash: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting: Maksimal 5 percobaan login per menit per IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`auth:login:${clientIp}`, 5, 60_000);
    if (!rateLimit.success) {
      return createRateLimitErrorResponse(rateLimit);
    }

    // 2. Validasi input menggunakan Zod
    const body = await request.json().catch(() => null);
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

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
