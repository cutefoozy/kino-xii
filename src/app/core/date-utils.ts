export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface DayOption {
  dateStr: string;
  dayName: string;
  dayNumber: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function nextDays(count = 7): DayOption[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    return { dateStr: toDateStr(d), dayName: DAY_NAMES[d.getDay()], dayNumber: String(d.getDate()) };
  });
}