// FILE: navigation.ts
// Purpose: Keeps shell navigation labels and routes out of the visual layout component.
// Layer: App config
// Exports: publicLinks, privateLinks

export type NavigationLink = {
  label: string;
  to: string;
};

export const publicLinks: NavigationLink[] = [{ to: "/how-to-play", label: "Regole" }];

export const privateLinks: NavigationLink[] = [
  { to: "/challenges", label: "Enigmi" },
  { to: "/leaderboard", label: "Podio" },
];
