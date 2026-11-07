const WISHLIST_STORAGE_KEY = "eventhub_wishlist";
const WISHLIST_CHANGE_EVENT = "eventhub-wishlist-change";

function readWishlistIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]");
    return Array.isArray(saved) && saved.every((id) => typeof id === "string") ? saved : [];
  } catch {
    return [];
  }
}

function writeWishlistIds(ids: string[]) {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(WISHLIST_CHANGE_EVENT));
}

export function getWishlistIds(): string[] {
  return readWishlistIds();
}

export function isEventInWishlist(eventId: string): boolean {
  return readWishlistIds().includes(eventId);
}

export function toggleWishlist(eventId: string, notify = true): boolean {
  const ids = readWishlistIds();
  const isSaved = ids.includes(eventId);
  const nextIds = isSaved ? ids.filter((id) => id !== eventId) : [...ids, eventId];
  if (notify) {
    writeWishlistIds(nextIds);
  } else {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(nextIds));
  }
  return !isSaved;
}

export function subscribeToWishlist(listener: () => void): () => void {
  window.addEventListener("storage", listener);
  window.addEventListener(WISHLIST_CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(WISHLIST_CHANGE_EVENT, listener);
  };
}
