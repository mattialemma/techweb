// File: ApplicationChrome.tsx
// Scopo: Renderizza shell condivisa, navigazione alta, azioni autenticazione e outlet delle rotte.
// Livello: Componente applicativo
// Dipende da: React Router, contesto autenticazione, primitive UI condivise

import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { privateLinks, publicLinks, type NavigationLink } from "@app/navigation";
import { useAuth } from "@features/auth";
import type { AuthUser } from "@features/auth";
import { Avatar, Button } from "@shared/ui";

const activeNavClass = "bg-lime-300/[0.14] text-lime-100 shadow-inner shadow-lime-950/20";
const idleNavClass = "text-zinc-300 hover:bg-white/10 hover:text-white";
const navBaseClass =
  "rounded px-3 py-2 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-lime-300/25";

function composeNavigationState({ isActive }: { isActive: boolean }): string {
  return `${navBaseClass} ${
    isActive
      ? activeNavClass
      : idleNavClass
  }`;
}

function BrandLink() {
  return (
    <Link to="/" className="flex items-center gap-3 text-lg font-black tracking-wide text-white">
      <span className="grid h-9 w-9 place-items-center rounded border border-lime-300/30 bg-lime-300/10 font-mono text-sm text-lime-200 shadow-lg shadow-lime-950/20">
        rx
      </span>
      <span>
        PATTERN<span className="text-lime-300">LAB</span>
      </span>
    </Link>
  );
}

function NavLinkGroup({ links }: { links: NavigationLink[] }) {
  return (
    <>
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} className={composeNavigationState}>
          {link.label}
        </NavLink>
      ))}
    </>
  );
}

function MobileProfileLink({
  onOpen,
  user,
}: {
  onOpen: () => void;
  user: AuthUser | null;
}) {
  return user ? (
    <Link aria-label="Apri profilo" className="lg:hidden" to="/settings" onClick={onOpen}>
      <Avatar src={user.avatarUrl} name={user.username} size="sm" />
    </Link>
  ) : null;
}

function DesktopProfileLink({ onOpen, user }: { onOpen: () => void; user: AuthUser }) {
  return (
    <Link
      className="hidden items-center gap-2 rounded px-2 py-1 transition hover:bg-white/10 lg:flex"
      to="/settings"
      onClick={onOpen}
    >
      <Avatar src={user.avatarUrl} name={user.username} size="sm" />
      <span className="max-w-32 truncate text-sm text-zinc-300">{user.username}</span>
    </Link>
  );
}

function LogoutPrompt({
  isLoading,
  onCancel,
  onConfirm,
}: {
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm font-semibold text-zinc-300 sm:inline">Confermi?</span>
      <Button variant="danger" isLoading={isLoading} onClick={onConfirm}>
        Ok
      </Button>
      <Button variant="secondary" disabled={isLoading} onClick={onCancel}>
        No
      </Button>
    </div>
  );
}

function GuestActions() {
  return (
    <>
      <Link to="/login">
        <Button variant="ghost">Login</Button>
      </Link>
      <Link to="/register">
        <Button>Registrati</Button>
      </Link>
    </>
  );
}

export function ApplicationChrome() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutPromptOpen, setIsLogoutPromptOpen] = useState(false);
  const [isLogoutRunning, setIsLogoutRunning] = useState(false);

  function closeLogoutPrompt() {
    setIsLogoutPromptOpen(false);
  }

  async function handleLogout() {
    setIsLogoutRunning(true);
    try {
      await logout();
      navigate("/", { replace: true });
    } finally {
      setIsLogoutRunning(false);
      closeLogoutPrompt();
    }
  }

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/82 shadow-lg shadow-black/20 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <BrandLink />
            <MobileProfileLink user={user} onOpen={closeLogoutPrompt} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAuthenticated ? (
              <>
                <NavLinkGroup links={publicLinks} />
                <NavLinkGroup links={privateLinks} />
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <DesktopProfileLink user={user} onOpen={closeLogoutPrompt} />
                {isLogoutPromptOpen ? (
                  <LogoutPrompt
                    isLoading={isLogoutRunning}
                    onCancel={closeLogoutPrompt}
                    onConfirm={handleLogout}
                  />
                ) : (
                  <Button variant="secondary" onClick={() => setIsLogoutPromptOpen(true)}>
                    Logout
                  </Button>
                )}
              </>
            ) : (
              <GuestActions />
            )}
          </div>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
