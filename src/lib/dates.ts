// all week math runs on YYYY-MM-DD strings interpreted as UTC dates, so the
// server timezone never shifts a Monday into a Sunday.

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const DAY_LABELS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function parseIsoDate(s: string) {
  return new Date(`${s}T00:00:00Z`);
}

export function addDays(iso: string, days: number) {
  const d = parseIsoDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

// monday of the week that contains the given date
export function startOfWeek(iso: string) {
  const d = parseIsoDate(iso);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return toIsoDate(d);
}

export function currentWeekStart() {
  return startOfWeek(toIsoDate(new Date()));
}

// accepts ?week= from the url; anything odd falls back to this week
export function resolveWeekParam(week: string | undefined) {
  if (week && ISO_DATE.test(week) && !Number.isNaN(parseIsoDate(week).getTime())) {
    return startOfWeek(week);
  }
  return currentWeekStart();
}

export function formatShort(iso: string) {
  const d = parseIsoDate(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function formatWeekRange(weekStart: string) {
  return `${formatShort(weekStart)} to ${formatShort(addDays(weekStart, 6))}`;
}

export function dayDate(weekStart: string, dayOfWeek: number) {
  return addDays(weekStart, dayOfWeek);
}
