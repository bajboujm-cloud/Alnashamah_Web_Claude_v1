/** Delivery dates and slots (pure functions, Dubai time = UTC+4 all year). */
export const BOOKING_DAYS = 60;
const DUBAI_OFFSET_HOURS = 4;
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

/** Today's date in Dubai as "YYYY-MM-DD". */
export const dubaiToday = (now: Date) =>
  new Date(now.getTime() + DUBAI_OFFSET_HOURS * 3_600_000).toISOString().slice(0, 10);

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A slot on a date is still open if its start, minus the cut-off, is in the future. */
export function slotOpen(date: string, slot: { startTime: string; cutoffHours: number }, now: Date) {
  if (!isDate(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = slot.startTime.split(":").map(Number);
  const startUtc = Date.UTC(y, m - 1, d, (hh || 0) - DUBAI_OFFSET_HOURS, mm || 0);
  return startUtc - slot.cutoffHours * 3_600_000 > now.getTime();
}

/** Can this date + slot be booked now? (within the booking window, not a blackout day, before cut-off) */
export function isBookable(
  date: string,
  slot: { startTime: string; cutoffHours: number },
  now: Date,
  blackouts: ReadonlySet<string>,
) {
  if (!isDate(date) || blackouts.has(date)) return false;
  const today = dubaiToday(now);
  if (date < today || date > addDays(today, BOOKING_DAYS)) return false;
  return slotOpen(date, slot, now);
}
