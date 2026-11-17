import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/lib/auth";
import {
  getUserWishlistEventIds,
  getUserWishlistEvents,
  toggleUserWishlist,
} from "@/lib/services/wishlist-service";
import { wishlistActionSchema, formatZodError } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireUser();
    const [ids, events] = await Promise.all([
      getUserWishlistEventIds(user.id),
      getUserWishlistEvents(user.id),
    ]);
    return NextResponse.json({ ids, events }, { status: 200 });
  } catch (error) {
    console.error("[API_GET_USER_WISHLIST_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: "Gagal mengambil daftar wishlist dari database." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const rawBody = await request.json().catch(() => null);

    const validation = wishlistActionSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const { eventId } = validation.data;
    const result = await toggleUserWishlist(user.id, eventId);
    const updatedIds = await getUserWishlistEventIds(user.id);

    return NextResponse.json(
      {
        success: true,
        isInWishlist: result.isInWishlist,
        ids: updatedIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API_POST_USER_WISHLIST_ERROR]:", error);
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memperbarui wishlist." },
      { status: 500 }
    );
  }
}
