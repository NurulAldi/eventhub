import { NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { getUserSubmissions } from "@/lib/services/event-service";

export async function GET() {
  try {
    const user = await requireUser();
    const submissions = await getUserSubmissions(user.id);
    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error("[API_GET_USER_SUBMISSIONS_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: "Gagal mengambil pengajuan event pengguna." },
      { status: 500 }
    );
  }
}
