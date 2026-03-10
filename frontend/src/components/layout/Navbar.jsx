import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, LogOut, PlusCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import useAuthStore from "../../store/authStore.js";
import Button from "../ui/Button.jsx";

export default function Navbar() {
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

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

          {/* Center nav */}
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
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
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
                  className="text-text-muted hover:text-danger"
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
          </div>
        </div>
      </div>
    </nav>
  );
}
