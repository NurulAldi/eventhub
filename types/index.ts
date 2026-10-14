/**
 * Type definitions for EventHub Kampus
 */

export type EventCategory =
  | "Seminar"
  | "Workshop"
  | "Lomba"
  | "Beasiswa"
  | "Konser & Musik"
  | "Olahraga";

export type EventStatus = "active" | "draft" | "completed" | "cancelled";

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // Format e.g.: "2026-10-28" or "28 Oktober 2026"
  time?: string; // Format e.g.: "09:00 - 13:00 WIB"
  location: string;
  category: EventCategory | string;
  image: string;
  price: number; // 0 for free events
  organizer: string;
  quota?: number;
  registeredCount?: number;
  status?: EventStatus;
  requirements?: string[];
  contactPic?: string;
  isPopular?: boolean;
}

export interface RegisteredEvent {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  category: string;
  date: string;
  time: string;
  location: string;
  registeredAt: string;
  ticketStatus: "active" | "completed" | "cancelled";
  qrCodeMock?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  nim?: string;
  major?: string;
  faculty?: string;
  phone?: string;
  registeredEvents: RegisteredEvent[];
}

export interface AdminStats {
  totalEvents: number;
  totalUsers: number;
  pendingApprovals: number;
  activeEvents?: number;
  totalRegistrations?: number;
}
