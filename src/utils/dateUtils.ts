/**
 * Calculates the next upcoming Sunday in YYYY-MM-DD format.
 * If today is Sunday, returns today.
 */
export function getUpcomingSunday(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day === 0 ? 0 : 7 - day;
  const nextSunday = new Date(d);
  nextSunday.setDate(d.getDate() + diff);
  return nextSunday.toISOString().split('T')[0];
}

/**
 * Formats a YYYY-MM-DD date into a readable string (e.g., "Oct 12, 2026")
 */
export function formatDateReadable(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr || '';
  }
}
