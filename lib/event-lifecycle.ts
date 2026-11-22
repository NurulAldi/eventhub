export type EventLifecycleStage =
  | "deadline_countdown"
  | "event_countdown"
  | "ongoing"
  | "closed";

export interface EventLifecycleStatus {
  stage: EventLifecycleStage;
  label: string;
  badgeClass: string;
  isClosed: boolean;
  deadlineDays: number | null;
  eventDays: number | null;
}

/**
 * Menghitung selisih hari antara tanggal target (YYYY-MM-DD) dan hari ini.
 * target - today dalam hitungan hari kalender.
 */
export function getCalendarDaysDiff(dateString?: string | null, now = new Date()): number | null {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return null;

  const targetDay = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((targetDay - today) / 86400000);
}

/**
 * Menentukan status alur countdown dan pelaksanaan event aktif:
 * 1. Jika status event adalah completed, cancelled, atau rejected -> Ditutup.
 * 2. Selama deadline pendaftaran masih belum lewat (deadlineDays >= 0):
 *    - Tampilkan countdown berapa hari lagi menuju deadline pendaftaran ("X hari lagi menuju deadline").
 *    - Jika hari H deadline (deadlineDays === 0) -> "Hari Terakhir Pendaftaran".
 * 3. Setelah lewat deadline pendaftaran (deadlineDays < 0):
 *    - Masuk countdown berapa hari lagi menuju pelaksanaan ("X hari lagi menuju pelaksanaan").
 *    - Ketika masuk tanggal pelaksanaan (eventDays === 0) -> "Berlangsung".
 *    - Setelah tanggal pelaksanaan lewat (eventDays < 0) -> "Ditutup".
 */
export function getEventLifecycleStatus(
  event: {
    status?: string | null;
    date: string;
    registrationDeadline?: string | null;
  },
  now = new Date()
): EventLifecycleStatus {
  const isHardClosed = ["completed", "cancelled", "rejected"].includes(event.status || "");
  const deadlineDays = getCalendarDaysDiff(event.registrationDeadline, now);
  const eventDays = getCalendarDaysDiff(event.date, now);

  if (isHardClosed) {
    return {
      stage: "closed",
      label: "Ditutup",
      badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
      isClosed: true,
      deadlineDays,
      eventDays,
    };
  }

  // Jika memiliki deadline pendaftaran dan deadline belum lewat
  if (deadlineDays !== null && deadlineDays >= 0) {
    if (deadlineDays === 0) {
      return {
        stage: "deadline_countdown",
        label: "Hari Terakhir Pendaftaran",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
        isClosed: false,
        deadlineDays,
        eventDays,
      };
    }
    return {
      stage: "deadline_countdown",
      label: `${deadlineDays} hari lagi menuju deadline`,
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      isClosed: false,
      deadlineDays,
      eventDays,
    };
  }

  // Jika deadline sudah lewat (deadlineDays < 0) atau tidak ada registrationDeadline
  // Masuk ke countdown tanggal pelaksanaan
  if (eventDays !== null) {
    if (eventDays > 0) {
      return {
        stage: "event_countdown",
        label: `${eventDays} hari lagi menuju pelaksanaan`,
        badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
        isClosed: deadlineDays !== null ? deadlineDays < 0 : false,
        deadlineDays,
        eventDays,
      };
    }
    if (eventDays === 0) {
      return {
        stage: "ongoing",
        label: "Berlangsung",
        badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-300",
        isClosed: deadlineDays !== null ? deadlineDays < 0 : false,
        deadlineDays,
        eventDays,
      };
    }
  }

  return {
    stage: "closed",
    label: "Ditutup",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
    isClosed: true,
    deadlineDays,
    eventDays,
  };
}
