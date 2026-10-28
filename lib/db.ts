/**
 * Database connection layer for EventHub UNP
 * Menggunakan driver PostgreSQL resmi 'pg' dengan Connection Pooling.
 * Menghubungkan aplikasi langsung ke Database Server PostgreSQL (Lokal / Docker / Cloud).
 */

import { Pool, QueryResult, QueryResultRow } from "pg";
import fs from "fs";
import path from "path";

declare global {
  var __eventhub_pg_pool: Pool | undefined;
}

/**
 * Helper untuk membaca .env.local jika script dijalankan secara standalone (misal via tsx/node)
 */
function ensureEnvLoaded(): void {
  if (process.env.DATABASE_URL) return;

  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      if (process.env.DATABASE_URL) break;
    }
  }
}

/**
 * Validasi dan ambil konfigurasi connection string PostgreSQL dari environment
 */
export function getDatabaseUrl(): string {
  ensureEnvLoaded();

  const url = process.env.DATABASE_URL;
  if (!url || !url.trim()) {
    throw new Error(
      "[DATABASE_CONFIG_ERROR] Environment variable DATABASE_URL belum dikonfigurasi. " +
      "Pastikan Anda telah menyetel DATABASE_URL (misalnya: postgresql://postgres:postgrespassword@localhost:5432/eventhub) " +
      "di file .env.local atau environment hosting server."
    );
  }
  return url.trim();
}

/**
 * Singleton Connection Pool untuk Next.js
 * Mencegah exhaustion koneksi database saat Hot Module Replacement (HMR) di mode development
 */
export function getPool(): Pool {
  if (globalThis.__eventhub_pg_pool) {
    return globalThis.__eventhub_pg_pool;
  }

  const connectionString = getDatabaseUrl();
  const isCloudOrSsl =
    connectionString.includes("sslmode=require") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("supabase.co") ||
    process.env.DB_SSL === "true";

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    ssl: isCloudOrSsl ? { rejectUnauthorized: false } : undefined,
  });

  pool.on("error", (err) => {
    console.error("[POSTGRESQL_POOL_ERROR] Unexpected error on idle client:", err);
  });

  globalThis.__eventhub_pg_pool = pool;
  return pool;
}

/**
 * Helper eksekusi query SQL terparameterisasi dengan return type aman
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  try {
    const result: QueryResult<T> = await pool.query<T>(
      sql,
      params as unknown[] | undefined
    );
    return result.rows || [];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[POSTGRESQL_QUERY_FAILED]:", message);
    throw error;
  }
}

/**
 * Helper untuk query yang mengembalikan satu baris saja
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Uji koneksi langsung ke PostgreSQL server
 */
export async function testConnection(): Promise<{
  ok: boolean;
  version?: string;
  database?: string;
  error?: string;
}> {
  try {
    const pool = getPool();
    const res = await pool.query<{ version: string; current_database: string }>(
      "SELECT version(), current_database();"
    );
    return {
      ok: true,
      version: res.rows[0]?.version,
      database: res.rows[0]?.current_database,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Inisialisasi skema tabel dan indeks pada PostgreSQL Server
 * Bersifat idempoten (aman dijalankan berulang kali)
 */
export async function initSchema(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    // 1. Buat tabel events jika belum ada
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        date VARCHAR(64) NOT NULL,
        time VARCHAR(64),
        location VARCHAR(255) NOT NULL,
        category VARCHAR(64) NOT NULL,
        image TEXT NOT NULL,
        price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
        organizer VARCHAR(255) NOT NULL,
        quota INTEGER NOT NULL DEFAULT 100 CHECK (quota >= 0),
        registered_count INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
        contact_pic VARCHAR(255),
        is_popular BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Buat indeks performa
    await client.query(`CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_events_is_popular ON events(is_popular);`);

    await client.query("COMMIT;");
  } catch (error) {
    await client.query("ROLLBACK;");
    throw error;
  } finally {
    client.release();
  }
}
