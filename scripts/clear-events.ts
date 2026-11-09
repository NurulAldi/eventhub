import { getPool } from "../lib/db";

async function main() {
  const pool = getPool();
  try {
    const result = await pool.query("DELETE FROM events");
    console.log(`✓ ${result.rowCount ?? 0} data event dihapus dari database.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("✗ Gagal menghapus data event:", error);
  process.exitCode = 1;
});
