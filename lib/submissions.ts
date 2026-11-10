import type { Event } from "@/types";

function getSubmissionsKey(userId: string): string {
  return `eventhub_submissions_${userId}`;
}

export function getSubmittedEvents(userId: string): Event[] {
  try {
    const stored = JSON.parse(localStorage.getItem(getSubmissionsKey(userId)) || "[]");
    if (Array.isArray(stored) && stored.length > 0) return stored as Event[];
  } catch {
    console.error("Data pengajuan event di penyimpanan lokal tidak valid.");
    return [];
  }
  return [];
}

export function saveSubmittedEvent(userId: string, event: Event) {
  const submissions = getSubmittedEvents(userId).filter((item) => item.id !== event.id);
  localStorage.setItem(getSubmissionsKey(userId), JSON.stringify([event, ...submissions]));
}
