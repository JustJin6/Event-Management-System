import { fromInputValue, isUpcoming, toInputValue } from './datetime';

describe('datetime helpers', () => {
  it('round-trips between an ISO string and a datetime-local value', () => {
    const iso = new Date(2026, 10, 5, 14, 30).toISOString(); // 5 Nov 2026, 14:30 local time
    expect(toInputValue(iso)).toBe('2026-11-05T14:30');
    expect(fromInputValue('2026-11-05T14:30')).toBe(iso);
  });

  it('knows whether a date is upcoming', () => {
    const now = new Date('2026-10-14T12:00:00Z').getTime();
    expect(isUpcoming('2026-10-15T09:00:00Z', now)).toBe(true);
    expect(isUpcoming('2026-10-13T09:00:00Z', now)).toBe(false);
  });
});
