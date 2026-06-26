import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "@features/auth";
import { Avatar, Button } from "@shared/ui";

const publicLinks = [{ to: "/how-to-play", label: "Come si gioca" }];
const privateLinks = [
  { to: "/challenges", label: "Sfide" },
  { to: "/leaderboard", label: "Classifica" },
  { to: "/settings", label: "Account" },
];

function navClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-300/25 ${
    isActive
      ? "bg-emerald-300/[0.12] text-emerald-100 shadow-inner shadow-emerald-950/20"
      : "text-slate-300 hover:bg-white/10 hover:text-white"
  }`;
}

export function PageShell() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/78 shadow-lg shadow-black/15 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3 text-lg font-black tracking-wide text-white">
              <span className="grid h-9 w-9 place-items-center rounded-md border border-emerald-300/25 bg-emerald-300/10 font-mono text-sm text-emerald-200 shadow-lg shadow-emerald-950/20">
                .*
              </span>
              <span>
                REGEX<span className="text-emerald-300">RIDDLE</span>
              </span>
            </Link>
            {user ? (
              <div className="lg:hidden">
                <Avatar src={user.avatarUrl} name={user.username} size="sm" />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {publicLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated
              ? privateLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className={navClass}>
                    {link.label}
                  </NavLink>
                ))
              : null}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <div className="hidden items-center gap-2 lg:flex">
                  <Avatar src={user.avatarUrl} name={user.username} size="sm" />
                  <span className="max-w-32 truncate text-sm text-slate-300">{user.username}</span>
                </div>
                <Button variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
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
