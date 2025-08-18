// Timezone utilities for IST handling without external libraries
// IST is UTC+05:30 and does not observe DST

const IST_OFFSET_MINUTES = 5 * 60 + 30; // 330 minutes

// Parse a datetime-local string (YYYY-MM-DDTHH:mm)
function parseLocalDateTime(input: string): { year: number; month: number; day: number; hour: number; minute: number } | null {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input)) return null;
  const [datePart, timePart] = input.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return { year, month, day, hour, minute };
}

// Convert a datetime-local value (assumed IST) to UTC ISO string
export function istLocalInputToUTCISOString(input: string): string {
  // If already ISO with timezone, normalize by Date
  if (/Z$/.test(input) || /[\+\-]\d{2}:?\d{2}$/.test(input)) {
    return new Date(input).toISOString();
  }

  // If input is classic datetime-local (no seconds/timezone), treat as IST wall time
  const parts = parseLocalDateTime(input);
  if (parts) {
    const { year, month, day, hour, minute } = parts;
    // Construct UTC by subtracting IST offset
    const utcMs = Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MINUTES * 60 * 1000;
    return new Date(utcMs).toISOString();
  }

  // Fallback: attempt to parse and normalize
  return new Date(input).toISOString();
}

// Convert a UTC ISO string to a datetime-local value appropriate for IST (YYYY-MM-DDTHH:mm)
export function utcToISTLocalInputValue(utcISOString: string): string {
  const date = new Date(utcISOString);
  const istMs = date.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const ist = new Date(istMs);
  const yyyy = ist.getUTCFullYear();
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(ist.getUTCDate()).padStart(2, '0');
  const HH = String(ist.getUTCHours()).padStart(2, '0');
  const MM = String(ist.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
}

// Format any date string as IST human-readable
export function formatAsIST(dateString: string, withSeconds = true): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  if (withSeconds) options.second = '2-digit';
  return new Date(dateString).toLocaleString('en-IN', options);
}

// Export offset for testing or other calculations
export const IST_UTILS = { IST_OFFSET_MINUTES };
