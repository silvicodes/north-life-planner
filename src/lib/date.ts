export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  return next;
}

export function monthDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const days: Date[] = [];

  for (let day = 1; day <= last.getDate(); day += 1) {
    days.push(new Date(first.getFullYear(), first.getMonth(), day));
  }

  return days;
}

export function monthGridDays(date: Date) {
  const days = monthDays(date);
  const firstDay = days[0]?.getDay() || 1;
  const mondayBasedOffset = firstDay === 0 ? 6 : firstDay - 1;
  return [...Array<Date | null>(mondayBasedOffset).fill(null), ...days];
}

export function formatToday(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}
