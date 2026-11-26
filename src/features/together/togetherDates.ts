export const TOGETHER_DATES = {
  anniversary: 'Anniversary',
  firstMeet: 'First meeting',
  firstDate: 'First date',
  engagement: 'Engagement',
  memory: 'Special memory',
} as const;

export type TogetherDateId = keyof typeof TOGETHER_DATES;

export function parseTogetherDate(value: string): Date | null {
  if (!/^(19[0-9]{2}|20[0-9]{2})-[0-9]{2}-[0-9]{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function togetherDuration(start: Date, now: Date) {
  const anchor = (months: number) => {
    const year = start.getUTCFullYear();
    const month = start.getUTCMonth() + months;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Date.UTC(year, month, Math.min(start.getUTCDate(), lastDay));
  };
  let months = Math.max(0, (now.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    now.getUTCMonth() - start.getUTCMonth());
  if (months > 0 && anchor(months) > now.getTime()) months--;
  const seconds = Math.max(0, Math.floor((now.getTime() - anchor(months)) / 1000));
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  };
}
