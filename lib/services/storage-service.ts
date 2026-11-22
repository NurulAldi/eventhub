/**
 * Supabase Storage helper.
 * Rute upload menyimpan gambar event di bucket Supabase Storage, sehingga saat
 * event dihapus objek gambar yang sudah tidak dipakai juga perlu dibersihkan.
 */

const DEFAULT_BUCKET = "event-images";

function getStorageConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return { baseUrl: supabaseUrl.replace(/\/$/, ""), serviceRoleKey, bucket };
}

function getPublicPrefix(baseUrl: string, bucket: string) {
  return `${baseUrl}/storage/v1/object/public/${bucket}/`;
}

/**
 * Mengambil path objek storage dari URL publik Supabase Storage.
 * URL dari sumber lain (misalnya Unsplash) menghasilkan null dan tidak disentuh.
 */
export function getStorageObjectPath(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  const config = getStorageConfig();
  if (!config) return null;

  const publicPrefix = getPublicPrefix(config.baseUrl, config.bucket);
  if (!imageUrl.startsWith(publicPrefix)) return null;

  const objectPath = decodeURIComponent(imageUrl.slice(publicPrefix.length).split("?")[0]);
  // Jangan pernah mengirim path kosong atau path yang mencoba keluar dari bucket.
  if (!objectPath || objectPath.includes("..")) return null;
  return objectPath;
}

/**
 * Menghapus gambar-gambar event dari Supabase Storage dalam satu permintaan.
 * URL non-Supabase (Unsplash, QR server, dsb.) diabaikan.
 * Kegagalan tidak melempar error agar penghapusan event tetap berjalan.
 */
export async function deleteStorageObjects(images: Array<string | null | undefined>): Promise<string[]> {
  const config = getStorageConfig();
  if (!config) return [];

  const objectPaths = new Set<string>();
  for (const image of images) {
    const objectPath = getStorageObjectPath(image);
    if (objectPath) objectPaths.add(objectPath);
  }
  if (objectPaths.size === 0) return [];

  const prefixes = [...objectPaths];
  try {
    // Endpoint bulk delete: DELETE /storage/v1/object/{bucket} dengan body { prefixes }.
    const response = await fetch(`${config.baseUrl}/storage/v1/object/${config.bucket}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        apikey: config.serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes }),
    });

    if (!response.ok) {
      console.error("[DELETE_STORAGE_OBJECTS_ERROR]:", await response.text().catch(() => ""));
      return [];
    }
    return prefixes;
  } catch (error) {
    console.error("[DELETE_STORAGE_OBJECTS_ERROR]:", error);
    return [];
  }
}