// File: formatters.ts
// Scopo: Raccoglie funzioni di formattazione visuale condivise tra le pagine.
// Livello: Utilita condivisa
// Esporta: formattatori per date, numeri e nomi utente

const shortDateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const detailDateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function buildAverageFormatter(value: number): Intl.NumberFormat {
  return new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });
}

// Formatta date compatte per schede lista dove lo spazio e limitato.
export function formatShortDate(value: string): string {
  return shortDateFormatter.format(new Date(value));
}

// Formatta timestamp completi per viste di dettaglio dove il contesto conta.
export function formatDateTime(value: string): string {
  return detailDateFormatter.format(new Date(value));
}

// Mantiene compatte le medie della classifica senza nascondere decimali utili.
export function formatAverage(value: number): string {
  return buildAverageFormatter(value).format(value);
}

export function formatDisplayName(profile: {
  firstName: string;
  lastName: string;
  username: string;
}): string {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  return fullName || profile.username;
}
