import { NextResponse } from "next/server";
import { connection } from "next/server";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    await requireAdmin();
    const result = await queryOne<{ total_users: string }>(
      "SELECT COUNT(*)::text AS total_users FROM users WHERE role = 'user' AND is_active = TRUE"
    );

    return NextResponse.json({
      totalUsers: Number(result?.total_users ?? 0),
    });
  } catch (error) {
    console.error("[API_ADMIN_STATS_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json({ error: "Gagal mengambil statistik dashboard." }, { status: 500 });
  }
}
