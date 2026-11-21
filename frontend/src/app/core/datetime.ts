const pad = (n: number): string => String(n).padStart(2, '0');

// ISO string -> value for <input type="datetime-local"> in the user's local time ("2026-11-05T14:30").
export function toInputValue(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// <input type="datetime-local"> value (local time) -> ISO string for the API.
export function fromInputValue(value: string): string {
  return new Date(value).toISOString();
}

export function isUpcoming(iso: string, now: number = Date.now()): boolean {
  return new Date(iso).getTime() >= now;
}
