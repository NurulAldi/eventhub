const WISHLIST_CHANGE_EVENT = "eventhub-wishlist-change";

function getWishlistStorageKey(userId: string): string {
  return `eventhub_wishlist_${userId}`;
}

function readWishlistIds(userId: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = JSON.parse(localStorage.getItem(getWishlistStorageKey(userId)) || "[]");
    return Array.isArray(saved) && saved.every((id) => typeof id === "string") ? saved : [];
  } catch {
    return [];
  }
}

function writeWishlistIds(userId: string, ids: string[]) {
  localStorage.setItem(getWishlistStorageKey(userId), JSON.stringify(ids));
  window.dispatchEvent(new Event(WISHLIST_CHANGE_EVENT));
}

export function getWishlistIds(userId: string): string[] {
  return readWishlistIds(userId);
}

export function isEventInWishlist(userId: string, eventId: string): boolean {
  return readWishlistIds(userId).includes(eventId);
}

export function toggleWishlist(userId: string, eventId: string): boolean {
  const ids = readWishlistIds(userId);
  const isSaved = ids.includes(eventId);
  writeWishlistIds(userId, isSaved ? ids.filter((id) => id !== eventId) : [...ids, eventId]);
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
