/**
 * Type definitions for EventHub Kampus
 */

export type EventCategory =
  | "Seminar"
  | "Workshop"
  | "Lomba"
  | "Beasiswa"
  | "Konser & Musik"
  | "Olahraga"
  | "Technopreneurship";

export type EventStatus =
  | "active"
  | "draft"
  | "pending_review"
  | "needs_revision"
  | "approved"
  | "rejected"
  | "published"
  | "completed"
  | "cancelled";

export type DescriptionBlock =
  | { id: string; type: "heading1" | "heading2" | "heading3" | "paragraph"; content: string }
  | { id: string; type: "image"; content: string; alt?: string };

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // Format e.g.: "2026-10-28" or "28 Oktober 2026"
  durationDays?: number;
  time?: string; // Format e.g.: "09:00 - 13:00 WIB"
  location: string;
  eventMode?: "online" | "offline";
  category: EventCategory | string;
  image: string;
  descriptionBlocks?: DescriptionBlock[];
  price: number; // 0 for free events
  organizer: string;
  createdBy?: string;
  quota?: number;
  registeredCount?: number;
  status?: EventStatus;
  updatedAt?: string;
  requirements?: string[];
  contactPic?: string;
  isPopular?: boolean;
  organizerType?: string;
  institution?: string;
  organizerContact?: string;
  registrationDeadline?: string;
  registrationUrl?: string;
  purpose?: string;
  targetParticipants?: string;
  speakers?: string;
  facilities?: string[];
  rejectionReason?: string;
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
  avatar?: string;
  avatarUrl?: string;
  major?: string;
  faculty?: string;
  phone?: string;
  registeredEvents: RegisteredEvent[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  university?: string | null;
  avatarUrl?: string | null;
  role: "user";
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  createdEventsCount?: number;
}
