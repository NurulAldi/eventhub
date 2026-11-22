import { getPool } from "../lib/db";
import { deleteStorageObjects } from "../lib/services/storage-service";
import type { DescriptionBlock } from "../types";

/**
 * Mengambil URL gambar sampul dan gambar blok deskripsi dari semua event.
 * Dipakai agar gambar di Supabase Storage ikut dibersihkan.
 */
export async function collectEventImageUrls(): Promise<string[]> {
  const result = await getPool().query<{ image: string | null; description_blocks: unknown }>(
    "SELECT image, description_blocks FROM events"
  );

  const urls: string[] = [];
  for (const row of result.rows) {
    if (row.image) urls.push(row.image);
    if (Array.isArray(row.description_blocks)) {
      for (const block of row.description_blocks as DescriptionBlock[]) {
        if (block.type === "image" && block.content) urls.push(block.content);
      }
    }
  }
  return urls;
}

async function main() {
  const pool = getPool();
  try {
    // Gambar diambil sebelum baris event dihapus.
    const imageUrls = await collectEventImageUrls();
    const result = await pool.query("DELETE FROM events");
    console.log(`✓ ${result.rowCount ?? 0} data event dihapus dari database.`);
    if (imageUrls.length > 0) {
      const deletedImages = await deleteStorageObjects(imageUrls);
      console.log(`✓ ${deletedImages.length} gambar event dihapus dari Supabase Storage.`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("✗ Gagal menghapus data event:", error);
  process.exitCode = 1;
});