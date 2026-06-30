// FILE: formatters.ts
// Purpose: Collects display-only formatting helpers shared across pages.
// Layer: Shared utility
// Exports: date, number, and user-name formatters

// Formats compact dates for list cards where space is limited.
export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

// Formats full timestamps for detail views where context matters.
export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

// Keeps leaderboard averages compact without hiding meaningful decimals.
export function formatAverage(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

export function formatDisplayName(entry: {
  firstName: string;
  lastName: string;
  username: string;
}): string {
  return `${entry.firstName} ${entry.lastName}`.trim() || entry.username;
}
