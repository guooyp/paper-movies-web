const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/**
 * "2024-02-27" becomes "Feb 27, 2024". Anything that isn't a real calendar date
 * is returned unchanged rather than guessed at, and null or blank stays null.
 */
export function formatReleaseDate(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;

  const match = ISO_DATE.exec(text);
  if (!match) return text;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));

  // Date rolls 2024-02-31 over to March, so check it round-trips.
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? formatter.format(date) : text;
}
