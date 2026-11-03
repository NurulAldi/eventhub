import type { Event } from "@/types";

const submissionsKey = "eventhub_submissions";
const lastSubmissionKey = "eventhub_last_submission";

export function getSubmittedEvents(): Event[] {
  try {
    const stored = JSON.parse(localStorage.getItem(submissionsKey) || "[]");
    if (Array.isArray(stored) && stored.length > 0) return stored as Event[];

    const legacy = localStorage.getItem(lastSubmissionKey);
    return legacy ? [JSON.parse(legacy) as Event] : [];
  } catch {
    console.error("Data pengajuan event di penyimpanan lokal tidak valid.");
    return [];
  }
}

export function saveSubmittedEvent(event: Event) {
  const submissions = getSubmittedEvents().filter((item) => item.id !== event.id);
  localStorage.setItem(submissionsKey, JSON.stringify([event, ...submissions]));
  localStorage.setItem(lastSubmissionKey, JSON.stringify(event));
}
