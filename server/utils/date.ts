/**
 * Utility for consistent date and month parsing across StudentFund.
 * Prevents timezone off-by-one shifts on date boundaries.
 */

export function parseMiddayDate(input?: string | Date): Date {
  if (!input) return new Date();
  if (input instanceof Date) return input;

  // If input is YYYY-MM-DD, set to 12:00:00 UTC to prevent timezone shifts across midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T12:00:00.000Z`);
  }
  return new Date(input);
}

export function getMonthRange(monthStr: string): { start: Date; end: Date } {
  // monthStr is expected to be "YYYY-MM"
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10); // 1-indexed

  // Start is 1st of month at 00:00:00 UTC
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  // End is 1st of next month at 00:00:00 UTC
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  return { start, end };
}
