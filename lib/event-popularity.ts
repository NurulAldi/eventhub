import { Event } from "@/types";

export function getRegistrationPercentage(event: Pick<Event, "registeredCount" | "quota">): number {
  const quota = event.quota || 0;
  if (quota <= 0) return 0;
  return Math.min(100, Math.round(((event.registeredCount || 0) / quota) * 100));
}

export function getPopularityLabel(event: Pick<Event, "registeredCount" | "quota" | "status">): string | null {
  if (event.status === "completed" || event.status === "cancelled") return null;

  const percentage = getRegistrationPercentage(event);
  if (percentage >= 100) return "Kuota Penuh";
  if (percentage >= 90) return "Segera Penuh";
  if (percentage >= 75) return "Hampir Penuh";
  if (percentage >= 50) return "Banyak Diminati";
  return null;
}
