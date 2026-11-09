import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  await connection();
  try {
    return NextResponse.json({ user: await getCurrentUser() });
  } catch (error) {
    console.error("[API_AUTH_ME_ERROR]:", error);
    return NextResponse.json({ error: "Sesi gagal diperiksa." }, { status: 500 });
  }
}
