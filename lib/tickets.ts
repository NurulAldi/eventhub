import type { RegisteredEvent } from "@/types";

const ticketChangeEvent = "eventhub-ticket-change";

function getTicketsKey(userId: string): string {
  return `eventhub_registered_tickets:${userId}`;
}

export function getRegisteredTickets(userId: string): RegisteredEvent[] {
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

export function isEventRegistered(userId: string, eventId: string): boolean {
  return getRegisteredTickets(userId).some((ticket) => ticket.eventId === eventId);
}

export function addRegisteredTicket(userId: string, ticket: RegisteredEvent): boolean {
  const tickets = getRegisteredTickets(userId);
  if (tickets.some((item) => item.eventId === ticket.eventId)) return false;

  localStorage.setItem(getTicketsKey(userId), JSON.stringify([ticket, ...tickets]));
  window.dispatchEvent(new Event(ticketChangeEvent));
  return true;
}

export function removeRegisteredTickets(userId: string, eventIds: string[]) {
  if (eventIds.length === 0) return;
  const removedIds = new Set(eventIds);
  const tickets = getRegisteredTickets(userId).filter((ticket) => !removedIds.has(ticket.eventId));
  localStorage.setItem(getTicketsKey(userId), JSON.stringify(tickets));
  window.dispatchEvent(new Event(ticketChangeEvent));
}

export function subscribeToTickets(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(ticketChangeEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(ticketChangeEvent, listener);
  };
}
