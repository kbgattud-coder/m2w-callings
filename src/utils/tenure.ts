/**
 * Tenure utility functions for Church Calling Approvals
 */

// Format today's date as "29 Aug 2026"
export function getTodayDateString(): string {
  const now = new Date();
  const day = now.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

// Parse various date strings accurately
export function parseSustainedDate(dateStr: string | null): Date | null {
  if (!dateStr || dateStr.toLowerCase().includes('vacant')) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // 1. Check YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Check DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (slashMatch) {
    const p1 = parseInt(slashMatch[1], 10);
    const p2 = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);
    // If p1 > 12, it's definitely DD/MM/YYYY
    if (p1 > 12) {
      return new Date(year, p2 - 1, p1);
    }
    // Default to DD/MM/YYYY in Philippines context, or check standard
    return new Date(year, p2 - 1, p1);
  }

  // 3. Fallback custom parse for "3 Apr 2022", "12 Jul 2026", "29 August 2026"
  const monthsMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  const parts = trimmed.replace(/,/g, '').split(/\s+/);
  if (parts.length === 3) {
    // Format: "12 Jul 2026" (DD Month YYYY)
    const dayAsFirst = parseInt(parts[0], 10);
    const monthKeyFirst = parts[1].toLowerCase();
    const yearLast = parseInt(parts[2], 10);
    
    if (!isNaN(dayAsFirst) && monthsMap[monthKeyFirst] !== undefined && !isNaN(yearLast)) {
      return new Date(yearLast, monthsMap[monthKeyFirst], dayAsFirst);
    }

    // Format: "Jul 12 2026" (Month DD YYYY)
    const monthKeySecond = parts[0].toLowerCase();
    const dayAsSecond = parseInt(parts[1], 10);
    if (monthsMap[monthKeySecond] !== undefined && !isNaN(dayAsSecond) && !isNaN(yearLast)) {
      return new Date(yearLast, monthsMap[monthKeySecond], dayAsSecond);
    }
  }

  // 4. Standard JS date parser
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

// Calculate tenure relative to current date (dynamic new Date())
export function calculateTenure(sustainedDateStr: string | null, referenceDate?: Date): {
  years: number;
  months: number;
  totalMonths: number;
  displayText: string;
  badgeColor: 'gray' | 'green' | 'amber' | 'purple';
} {
  if (!sustainedDateStr || sustainedDateStr.toLowerCase().includes('vacant')) {
    return {
      years: 0,
      months: 0,
      totalMonths: 0,
      displayText: 'Vacant',
      badgeColor: 'gray',
    };
  }

  const startDate = parseSustainedDate(sustainedDateStr);
  if (!startDate) {
    return {
      years: 0,
      months: 0,
      totalMonths: 0,
      displayText: 'Date Unknown',
      badgeColor: 'gray',
    };
  }

  const ref = referenceDate ? new Date(referenceDate) : new Date();
  
  // Normalize time components for clean day/month comparison
  startDate.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);

  // If start date is in the future or today
  if (startDate.getTime() >= ref.getTime()) {
    return {
      years: 0,
      months: 0,
      totalMonths: 0,
      displayText: 'New (< 1 mo)',
      badgeColor: 'green',
    };
  }

  let totalMonths = (ref.getFullYear() - startDate.getFullYear()) * 12 + (ref.getMonth() - startDate.getMonth());
  if (ref.getDate() < startDate.getDate()) {
    totalMonths--;
  }

  if (totalMonths <= 0) {
    return {
      years: 0,
      months: 0,
      totalMonths: 0,
      displayText: 'New (< 1 mo)',
      badgeColor: 'green',
    };
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  let displayText = '';
  if (years > 0 && months > 0) {
    displayText = `${years} yr${years > 1 ? 's' : ''} ${months} mo${months > 1 ? 's' : ''}`;
  } else if (years > 0) {
    displayText = `${years} yr${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    displayText = `${months} mo${months > 1 ? 's' : ''}`;
  } else {
    displayText = 'New (< 1 mo)';
  }

  // Color badges based on length of service
  // < 24 months (< 2 yrs): green (Active / Normal)
  // 24 - 36 months (2-3 yrs): amber (Review suggested)
  // >= 36 months (3+ yrs): purple (Long service)
  let badgeColor: 'gray' | 'green' | 'amber' | 'purple' = 'green';
  if (totalMonths >= 36) {
    badgeColor = 'purple';
  } else if (totalMonths >= 24) {
    badgeColor = 'amber';
  }

  return {
    years,
    months,
    totalMonths,
    displayText,
    badgeColor,
  };
}

export function formatDateForDisplay(dateStr: string | null): string {
  if (!dateStr || dateStr.toLowerCase().includes('vacant')) return '—';
  const parsed = parseSustainedDate(dateStr);
  if (!parsed) return dateStr;
  
  return parsed.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
