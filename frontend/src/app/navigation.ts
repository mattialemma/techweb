// File: navigation.ts
// Scopo: Tiene etichette e rotte della shell fuori dal componente visuale di layout.
// Livello: Configurazione app
// Esporta: publicLinks, privateLinks

export type NavigationLink = {
  label: string;
  to: string;
};

export const publicLinks: NavigationLink[] = [{ to: "/how-to-play", label: "Regole" }];

export const privateLinks: NavigationLink[] = [
  { to: "/challenges", label: "Enigmi" },
  { to: "/leaderboard", label: "Podio" },
];
