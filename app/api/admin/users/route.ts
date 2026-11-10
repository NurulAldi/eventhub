import { NextResponse } from "next/server";
import { connection } from "next/server";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import type { AdminUser } from "@/types";

interface UserRow {
  id: string;
  name: string;
  email: string;
  university: string | null;
  avatar_url: string | null;
  role: "user";
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  created_events_count: string | number;
}

export async function GET() {
  await connection();
  try {
    await requireAdmin();

    // Mengambil semua user dengan role 'user' (role 'admin' sengaja difilter dan tidak ditampilkan)
    const rows = await query<UserRow>(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.university, 
         u.avatar_url, 
         u.role, 
         u.is_active, 
         u.created_at, 
         u.updated_at,
         COUNT(e.id)::int AS created_events_count
       FROM users u
       LEFT JOIN events e ON e.created_by = u.id
       WHERE u.role = 'user'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    const users: AdminUser[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      university: row.university || null,
      avatarUrl: row.avatar_url || null,
      role: "user",
      isActive: Boolean(row.is_active),
      createdAt: typeof row.created_at === "string" ? row.created_at : row.created_at.toISOString(),
      updatedAt: typeof row.updated_at === "string" ? row.updated_at : row.updated_at?.toISOString(),
      createdEventsCount: Number(row.created_events_count || 0),
    }));

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("[API_ADMIN_GET_USERS_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json({ error: "Gagal memuat data pengguna." }, { status: 500 });
  }
}

