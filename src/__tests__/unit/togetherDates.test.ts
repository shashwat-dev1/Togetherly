import { parseTogetherDate, togetherDuration } from '@/features/together/togetherDates';

test('calendar duration clamps leap anniversaries and keeps the remaining clock time', () => {
  expect(togetherDuration(parseTogetherDate('2024-02-29')!, new Date('2025-02-28T01:02:03Z')))
    .toEqual({ years: 1, months: 0, days: 0, hours: 1, minutes: 2, seconds: 3 });
  expect(parseTogetherDate('2023-02-29')).toBeNull();
  expect(parseTogetherDate('2024-13-01')).toBeNull();
  expect(togetherDuration(parseTogetherDate('2024-01-31')!, new Date('2024-03-01T00:00:00Z')))
    .toEqual({ years: 0, months: 1, days: 1, hours: 0, minutes: 0, seconds: 0 });
});
