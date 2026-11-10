import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import type { AdminUser } from "@/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  await connection();
  try {
    await requireAdmin();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID pengguna diperlukan." }, { status: 400 });
    }

    // Pastikan user ada dan role-nya 'user' (bukan admin)
    const existing = await queryOne<UserRow>(
      "SELECT id, name, email, university, avatar_url, role, is_active, created_at, updated_at FROM users WHERE id = $1 AND role = 'user'",
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan atau merupakan akun administrator yang tidak dapat diubah." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(Boolean(body.isActive));
    }

    if (typeof body.name === "string" && body.name.trim()) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name.trim());
    }

    if (body.university !== undefined) {
      updates.push(`university = $${paramIndex++}`);
      values.push(typeof body.university === "string" ? body.university.trim() || null : null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Tidak ada data perubahan yang dikirim." }, { status: 400 });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const updatedRow = await queryOne<UserRow>(
      `UPDATE users
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex} AND role = 'user'
       RETURNING id, name, email, university, avatar_url, role, is_active, created_at, updated_at`,
      values
    );

    if (!updatedRow) {
      return NextResponse.json({ error: "Gagal memperbarui data pengguna." }, { status: 500 });
    }

    const eventCountRow = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM events WHERE created_by = $1",
      [id]
    );

    const user: AdminUser = {
      id: updatedRow.id,
      name: updatedRow.name,
      email: updatedRow.email,
      university: updatedRow.university || null,
      avatarUrl: updatedRow.avatar_url || null,
      role: "user",
      isActive: Boolean(updatedRow.is_active),
      createdAt: typeof updatedRow.created_at === "string" ? updatedRow.created_at : updatedRow.created_at.toISOString(),
      updatedAt: typeof updatedRow.updated_at === "string" ? updatedRow.updated_at : updatedRow.updated_at?.toISOString(),
      createdEventsCount: Number(eventCountRow?.count || 0),
    };

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("[API_ADMIN_PATCH_USER_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json({ error: "Gagal memperbarui status/data pengguna." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  await connection();
  try {
    await requireAdmin();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID pengguna diperlukan." }, { status: 400 });
    }

    // Pastikan user adalah akun regular (bukan admin)
    const existing = await queryOne<{ id: string; role: string }>(
      "SELECT id, role FROM users WHERE id = $1",
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    if (existing.role === "admin") {
      return NextResponse.json(
        { error: "Akun administrator dilindungi dan tidak dapat dihapus." },
        { status: 403 }
      );
    }

    // Putuskan relasi created_by pada event agar foreign key tidak menyebabkan error
    await query("UPDATE events SET created_by = NULL WHERE created_by = $1", [id]);

    // Hapus akun user
    const deleted = await queryOne<{ id: string }>(
      "DELETE FROM users WHERE id = $1 AND role = 'user' RETURNING id",
      [id]
    );

    if (!deleted) {
      return NextResponse.json({ error: "Gagal menghapus pengguna dari database." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error("[API_ADMIN_DELETE_USER_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json({ error: "Gagal menghapus pengguna." }, { status: 500 });
  }
}

