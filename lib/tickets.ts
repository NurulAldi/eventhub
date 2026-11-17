import type { RegisteredEvent } from "@/types";
import { apiGetUserRegistrations } from "./api";

const ticketChangeEvent = "eventhub-ticket-change";

function getTicketsKey(userId: string): string {
  return `eventhub_registered_tickets:${userId}`;
}

export function getRegisteredTickets(userId: string): RegisteredEvent[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const stored = localStorage.getItem(getTicketsKey(userId));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as RegisteredEvent[];
    }
  } catch {
    console.error("Data tiket tersimpan tidak valid.");
  }

  return [];
}

export function saveRegisteredTickets(
  userId: string,
  tickets: RegisteredEvent[],
  options?: { notify?: boolean }
): void {
  if (typeof window === "undefined" || !userId) return;
  const key = getTicketsKey(userId);
  const oldVal = localStorage.getItem(key);
  const newVal = JSON.stringify(tickets);
  if (oldVal === newVal) return;
  localStorage.setItem(key, newVal);
  if (options?.notify !== false) {
    window.dispatchEvent(new Event(ticketChangeEvent));
  }
}

/**
 * Sinkronisasi tiket pendaftaran dari PostgreSQL Server
 */
export async function syncTicketsWithServer(userId: string): Promise<RegisteredEvent[]> {
  if (!userId) return [];
  try {
    const serverTickets = await apiGetUserRegistrations();
    saveRegisteredTickets(userId, serverTickets);
    return serverTickets;
  } catch (error) {
    console.error("Gagal menyinkronkan tiket pendaftaran dari server:", error);
    return getRegisteredTickets(userId);
  }
}

export function isEventRegistered(userId: string, eventId: string): boolean {
  return getRegisteredTickets(userId).some((ticket) => ticket.eventId === eventId);
}

export function addRegisteredTicket(userId: string, ticket: RegisteredEvent): boolean {
  if (!userId) return false;
  const tickets = getRegisteredTickets(userId);
  if (tickets.some((item) => item.eventId === ticket.eventId)) return false;

  saveRegisteredTickets(userId, [ticket, ...tickets]);
  return true;
}

export function removeRegisteredTickets(userId: string, eventIds: string[]) {
  if (!userId || eventIds.length === 0) return;
  const removedIds = new Set(eventIds);
  const tickets = getRegisteredTickets(userId).filter((ticket) => !removedIds.has(ticket.eventId));
  saveRegisteredTickets(userId, tickets);
}

export function subscribeToTickets(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", listener);
  window.addEventListener(ticketChangeEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(ticketChangeEvent, listener);
  };
}
