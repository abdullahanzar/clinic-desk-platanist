/**
 * Get start of day (00:00:00.000) for a given date
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day (23:59:59.999) for a given date
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Format date as DD/MM/YYYY
 */
export function formatDateIndian(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date as YYYY-MM-DD (for inputs)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format time as HH:MM AM/PM
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get today's date at start of day in local timezone
 */
export function getToday(): Date {
  return startOfDay(new Date());
}

/**
 * Get start of month (1st day at 00:00:00.000) for a given date
 */
export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of month (last day at 23:59:59.999) for a given date
 */
export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0); // Last day of previous month (i.e., the month we want)
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get start of year (Jan 1st at 00:00:00.000) for a given date
 */
export function startOfYear(date: Date): Date {
  const result = new Date(date);
  result.setMonth(0);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of year (Dec 31st at 23:59:59.999) for a given date
 */
export function endOfYear(date: Date): Date {
  const result = new Date(date);
  result.setMonth(11);
  result.setDate(31);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Format month name (e.g., "January 2025")
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Format short month name (e.g., "Jan 2025")
 */
export function formatShortMonthYear(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

/**
 * Get number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Get array of last N months including current
 */
export function getLastNMonths(n: number): { month: number; year: number; label: string }[] {
  const months: { month: number; year: number; label: string }[] = [];
  const now = new Date();
  
  for (let i = 0; i < n; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: date.getMonth() + 1, // 1-indexed
      year: date.getFullYear(),
      label: formatShortMonthYear(date),
    });
  }
  
  return months.reverse();
}
