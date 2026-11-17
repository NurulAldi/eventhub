import { NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { getUserRegistrations } from "@/lib/services/registration-service";

export async function GET() {
  try {
    const user = await requireUser();
    const tickets = await getUserRegistrations(user.id);
    return NextResponse.json(tickets, { status: 200 });
  } catch (error) {
    console.error("[API_GET_USER_REGISTRATIONS_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: "Gagal mengambil data tiket pendaftaran dari database." },
      { status: 500 }
    );
  }
}
