// FILE: ApplicationChrome.tsx
// Purpose: Renders the shared app shell, top navigation, auth actions, and route outlet.
// Layer: Widget
// Depends on: React Router, auth context, shared UI primitives

import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { privateLinks, publicLinks } from "@app/navigation";
import { useAuth } from "@features/auth";
import { Avatar, Button } from "@shared/ui";

function composeNavigationState({ isActive }: { isActive: boolean }) {
  return `rounded px-3 py-2 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-lime-300/25 ${
    isActive
      ? "bg-lime-300/[0.14] text-lime-100 shadow-inner shadow-lime-950/20"
      : "text-zinc-300 hover:bg-white/10 hover:text-white"
  }`;
}

export function ApplicationChrome() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/", { replace: true });
    } finally {
      setIsLoggingOut(false);
      setIsConfirmingLogout(false);
    }
  }

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/82 shadow-lg shadow-black/20 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3 text-lg font-black tracking-wide text-white">
              <span className="grid h-9 w-9 place-items-center rounded border border-lime-300/30 bg-lime-300/10 font-mono text-sm text-lime-200 shadow-lg shadow-lime-950/20">
                rx
              </span>
              <span>
                PATTERN<span className="text-lime-300">LAB</span>
              </span>
            </Link>
            {user ? (
              <Link
                aria-label="Apri profilo"
                className="lg:hidden"
                to="/settings"
                onClick={() => setIsConfirmingLogout(false)}
              >
                <Avatar src={user.avatarUrl} name={user.username} size="sm" />
              </Link>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {publicLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={composeNavigationState}>
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated
              ? privateLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className={composeNavigationState}>
                    {link.label}
                  </NavLink>
                ))
              : null}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  className="hidden items-center gap-2 rounded px-2 py-1 transition hover:bg-white/10 lg:flex"
                  to="/settings"
                  onClick={() => setIsConfirmingLogout(false)}
                >
                  <Avatar src={user.avatarUrl} name={user.username} size="sm" />
                  <span className="max-w-32 truncate text-sm text-zinc-300">{user.username}</span>
                </Link>
                {isConfirmingLogout ? (
                  <div className="flex items-center gap-2">
                    <span className="hidden text-sm font-semibold text-zinc-300 sm:inline">
                      Confermi?
                    </span>
                    <Button variant="danger" isLoading={isLoggingOut} onClick={handleLogout}>
                      Ok
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={isLoggingOut}
                      onClick={() => setIsConfirmingLogout(false)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={() => setIsConfirmingLogout(true)}>
                    Logout
                  </Button>
                )}
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Registrati</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
