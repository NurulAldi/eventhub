import { apiGetWishlist, apiToggleWishlist } from "./api";

const WISHLIST_CHANGE_EVENT = "eventhub-wishlist-change";

function getWishlistStorageKey(userId: string): string {
  return `eventhub_wishlist_${userId}`;
}

function readWishlistIds(userId: string): string[] {
  if (typeof window === "undefined" || !userId) return [];

  try {
    const saved = JSON.parse(localStorage.getItem(getWishlistStorageKey(userId)) || "[]");
    return Array.isArray(saved) && saved.every((id) => typeof id === "string") ? saved : [];
  } catch {
    return [];
  }
}

export function writeWishlistIds(userId: string, ids: string[]) {
  if (typeof window === "undefined" || !userId) return;
  const key = getWishlistStorageKey(userId);
  const newValue = JSON.stringify(ids);
  if (localStorage.getItem(key) === newValue) return;

  localStorage.setItem(key, newValue);
  window.dispatchEvent(new Event(WISHLIST_CHANGE_EVENT));
}

export function getWishlistIds(userId: string): string[] {
  return readWishlistIds(userId);
}

export function isEventInWishlist(userId: string, eventId: string): boolean {
  return readWishlistIds(userId).includes(eventId);
}

/**
 * Sinkronisasi wishlist pengguna dari PostgreSQL ke penyimpanan lokal
 */
export async function syncWishlistWithServer(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const data = await apiGetWishlist();
    writeWishlistIds(userId, data.ids);
    return data.ids;
  } catch (error) {
    console.error("Gagal menyinkronkan wishlist dari server:", error);
    return readWishlistIds(userId);
  }
}

/**
 * Toggle bookmark/wishlist dengan persistensi database PostgreSQL
 */
let wishlistWriteQueue = Promise.resolve();

export function toggleWishlist(userId: string, eventId: string): boolean {
  if (!userId || !eventId) return false;

  const ids = readWishlistIds(userId);
  const isSaved = ids.includes(eventId);
  const nextIds = isSaved ? ids.filter((id) => id !== eventId) : [...ids, eventId];

  // Optimistic update
  writeWishlistIds(userId, nextIds);

  // Serialkan toggle agar response lama tidak menimpa perubahan wishlist berikutnya.
  wishlistWriteQueue = wishlistWriteQueue
    .catch(() => undefined)
    .then(async () => {
      try {
        const res = await apiToggleWishlist(eventId);
        if (res && Array.isArray(res.ids)) {
          writeWishlistIds(userId, res.ids);
        }
      } catch (err) {
        console.error("Gagal menyimpan wishlist ke database:", err);
        writeWishlistIds(userId, ids);
      }
    });

  return !isSaved;
}

export function subscribeToWishlist(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", listener);
  window.addEventListener(WISHLIST_CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(WISHLIST_CHANGE_EVENT, listener);
  };
}
