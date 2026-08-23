/**
 * Tenure utility functions for Church Calling Approvals
 */

// Parse dates like "3 Apr 2022", "2022-04-03", "16 Apr 2023"
export function parseSustainedDate(dateStr: string | null): Date | null {
  if (!dateStr || dateStr.toLowerCase().includes('vacant')) return null;
  
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;

  // Fallback custom parse for "3 Apr 2022" or "28 Jun 2026"
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = parseInt(parts[2], 10);
    
    const monthsMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    
    const monthKey = monthStr.substring(0, 3).toLowerCase();
    if (monthsMap[monthKey] !== undefined && !isNaN(day) && !isNaN(year)) {
      return new Date(year, monthsMap[monthKey], day);
    }
  }

  return null;
}

// Calculate tenure relative to current date (or July 26, 2026 reference date)
export function calculateTenure(sustainedDateStr: string | null, referenceDate: Date = new Date('2026-07-26')): {
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

  const ref = referenceDate;
  
  let years = ref.getFullYear() - startDate.getFullYear();
  let months = ref.getMonth() - startDate.getMonth();
  
  if (months < 0 || (months === 0 && ref.getDate() < startDate.getDate())) {
    years--;
    months += 12;
  }

  const totalMonths = years * 12 + months;

  let displayText = '';
  if (years > 0 && months > 0) {
    displayText = `${years} yr${years > 1 ? 's' : ''} ${months} mo${months > 1 ? 's' : ''}`;
  } else if (years > 0) {
    displayText = `${years} yr${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    displayText = `${months} mo${months > 1 ? 's' : ''}`;
  } else {
    displayText = 'Less than a month';
  }

  // Color badges based on length of service
  // < 6 months: green (New)
  // 6 - 24 months: green/neutral (Active)
  // 24 - 36 months (2-3 yrs): amber (Review suggested)
  // > 36 months (3+ yrs): purple/amber (Long service)
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
