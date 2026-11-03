import type { RegisteredEvent } from "@/types";
import { userProfile } from "@/lib/mock-data";

const ticketsKey = "eventhub_registered_tickets";
const ticketChangeEvent = "eventhub-ticket-change";

export function getRegisteredTickets(): RegisteredEvent[] {
  try {
    const stored = localStorage.getItem(ticketsKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as RegisteredEvent[];
    }
  } catch {
    console.error("Data tiket tersimpan tidak valid.");
  }

  return userProfile.registeredEvents;
}

export function isEventRegistered(eventId: string): boolean {
  return getRegisteredTickets().some((ticket) => ticket.eventId === eventId);
}

export function addRegisteredTicket(ticket: RegisteredEvent): boolean {
  const tickets = getRegisteredTickets();
  if (tickets.some((item) => item.eventId === ticket.eventId)) return false;

  localStorage.setItem(ticketsKey, JSON.stringify([ticket, ...tickets]));
  window.dispatchEvent(new Event(ticketChangeEvent));
  return true;
}

export function removeRegisteredTickets(eventIds: string[]) {
  if (eventIds.length === 0) return;
  const removedIds = new Set(eventIds);
  const tickets = getRegisteredTickets().filter((ticket) => !removedIds.has(ticket.eventId));
  localStorage.setItem(ticketsKey, JSON.stringify(tickets));
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
