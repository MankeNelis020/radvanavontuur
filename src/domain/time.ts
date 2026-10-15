type Zoned = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

const WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function amsterdamParts(date: Date): Zoned {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAY[parts.weekday] ?? 0,
  };
}

export function atAmsterdam(
  base: Date,
  dayOffset: number,
  hour: number,
  minute: number,
): Date {
  const start = amsterdamParts(base);
  const anchor = new Date(Date.UTC(start.year, start.month - 1, start.day + dayOffset));
  const target = amsterdamParts(anchor);
  target.hour = hour;
  target.minute = minute;
  let utc = Date.UTC(target.year, target.month - 1, target.day, hour - 1, minute);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const got = amsterdamParts(new Date(utc));
    const deltaMinutes =
      (Date.UTC(target.year, target.month - 1, target.day, hour, minute) -
        Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute)) /
      60000;
    if (deltaMinutes === 0) return new Date(utc);
    utc += deltaMinutes * 60000;
  }
  return new Date(utc);
}

export function formatAmsterdam(date: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatClock(date: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
