import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

declare global {
  var __eventhub_rate_limit_store: Map<string, RateLimitRecord> | undefined;
}

function getStore(): Map<string, RateLimitRecord> {
  if (!globalThis.__eventhub_rate_limit_store) {
    globalThis.__eventhub_rate_limit_store = new Map<string, RateLimitRecord>();
  }
  return globalThis.__eventhub_rate_limit_store;
}

/**
 * Ekstrak IP client dari request headers
 */
export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  return "127.0.0.1";
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Memeriksa apakah request memenuhi aturan batasan rate limiting
 * @param key Identifier unik (misal: "login:192.168.1.1" atau "register:192.168.1.1")
 * @param limit Batas maksimal request dalam jendela waktu
 * @param windowMs Durasi jendela waktu dalam milidetik (default 60.000 ms = 1 menit)
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): RateLimitResult {
  const store = getStore();
  const now = Date.now();
  const record = store.get(key);

  // Bersihkan record lama jika window telah lewat
  if (!record || now >= record.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  // Jika masih dalam window
  if (record.count < limit) {
    record.count += 1;
    store.set(key, record);
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - record.count),
      resetAt: record.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  // Request melebihi batas limit
  const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return {
    success: false,
    limit,
    remaining: 0,
    resetAt: record.resetAt,
    retryAfterSeconds,
  };
}

/**
 * Buat respons 429 Too Many Requests standar
 */
export function createRateLimitErrorResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: `Terlalu banyak percobaan. Silakan coba kembali dalam ${result.retryAfterSeconds} detik.`,
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}

/**
 * Reset rate limit untuk key tertentu atau seluruh store (berguna untuk testing)
 */
export function resetRateLimit(key?: string): void {
  const store = getStore();
  if (key) {
    store.delete(key);
  } else {
    store.clear();
  }
}
