import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, LogOut, PlusCircle, Menu, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import useAuthStore from "../../store/authStore.js";
import Button from "../ui/Button.jsx";

export default function Navbar() {
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const navLinkClass =
    "block px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-surface2";

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 group">
            <span
              className="text-2xl tracking-wider"
              style={{
                fontFamily: '"Bebas Neue", cursive',
                color: "var(--color-text)",
              }}
            >
              VC
            </span>
            <ChevronRight
              className="w-5 h-5 transition-transform group-hover:translate-x-0.5"
              style={{ color: "var(--color-accent)" }}
            />
            <span
              className="text-2xl tracking-wider"
              style={{
                fontFamily: '"Bebas Neue", cursive',
                color: "var(--color-accent)",
              }}
            >
              Planner
            </span>
          </Link>

          {/* Center nav (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/explore"
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-surface2"
              style={{ color: "var(--color-text-muted)" }}
            >
              Explore
            </Link>
            {user && (
              <>
                <Link
                  to="/me?tab=drills"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-surface2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  My Drills
                </Link>
                <Link
                  to="/me?tab=sessions"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-surface2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  My Sessions
                </Link>
                <Link
                  to="/drills/new"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-surface2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <PlusCircle className="w-4 h-4" />
                  New Drill
                </Link>
                <Link
                  to="/sessions/new"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-surface2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <PlusCircle className="w-4 h-4" />
                  New Session
                </Link>
                <Link
                  to="/me?tab=modules"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-surface2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Modules
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/me"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                      style={{ border: "2px solid var(--color-border)" }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: "var(--color-accent)",
                        color: "#ffffff",
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <span
                    className="hidden sm:block text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {user.name}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="hidden md:flex text-text-muted hover:text-danger"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/register")}
                >
                  Register
                </Button>
              </>
            )}

            {/* Hamburger (mobile only) */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-surface2"
              style={{ color: "var(--color-text-muted)" }}
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {isMenuOpen && (
        <div
          className="md:hidden border-t px-4 py-3 flex flex-col gap-1"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <Link
            to="/explore"
            className={navLinkClass}
            style={{ color: "var(--color-text-muted)" }}
          >
            Explore
          </Link>
          {user && (
            <>
              <Link
                to="/me?tab=drills"
                className={navLinkClass}
                style={{ color: "var(--color-text-muted)" }}
              >
                My Drills
              </Link>
              <Link
                to="/me?tab=sessions"
                className={navLinkClass}
                style={{ color: "var(--color-text-muted)" }}
              >
                My Sessions
              </Link>
              <Link
                to="/drills/new"
                className={navLinkClass}
                style={{ color: "var(--color-text-muted)" }}
              >
                + New Drill
              </Link>
              <Link
                to="/sessions/new"
                className={navLinkClass}
                style={{ color: "var(--color-text-muted)" }}
              >
                + New Session
              </Link>
              <Link
                to="/me?tab=modules"
                className={navLinkClass}
                style={{ color: "var(--color-text-muted)" }}
              >
                Modules
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className={`${navLinkClass} text-left w-full`}
                style={{ color: "var(--color-danger)" }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
