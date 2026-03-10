import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Camera,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  Clock,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useMyDrills,
  useDeleteDrill,
  useDrillAnalytics,
} from "../hooks/useDrills.js";
import { useMySessions, useDeleteSession } from "../hooks/useSessions.js";
import { useMyFavourites } from "../hooks/useFavourites.js";
import useAuthStore from "../store/authStore.js";
import DrillFilters from "../components/drill/DrillFilters.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import { FOCUS_AREAS } from "../lib/constants.js";
import api from "../lib/api.js";
import toast from "react-hot-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "sessions";
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/api/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(res.data);
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  }
  const [drillFilters, setDrillFilters] = useState({ page: 1, limit: 20 });
  const [sessionFilters, setSessionFilters] = useState({ page: 1, limit: 20 });

  const { data: drillData, isLoading: drillsLoading } =
    useMyDrills(drillFilters);
  const { data: sessionData, isLoading: sessionsLoading } =
    useMySessions(sessionFilters);
  const { data: favourites } = useMyFavourites();
  const { data: analyticsData } = useDrillAnalytics();
  const [analyticsSortKey, setAnalyticsSortKey] = useState("view_count");
  const [analyticsSortAsc, setAnalyticsSortAsc] = useState(false);
  const deleteDrill = useDeleteDrill();
  const deleteSession = useDeleteSession();

  const drills = drillData?.items ?? [];
  const drillTotal = drillData?.total ?? 0;
  const sessions = sessionData?.items ?? [];
  const sessionTotal = sessionData?.total ?? 0;

  async function handleDeleteDrill(e, id) {
    e.stopPropagation();
    if (!confirm("Delete this drill? This action cannot be undone.")) return;
    await deleteDrill.mutateAsync(id);
  }

  async function handleDeleteSession(e, id) {
    e.stopPropagation();
    if (!confirm("Delete this session? This action cannot be undone.")) return;
    await deleteSession.mutateAsync(id);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-surface-2)",
              border: "2px solid var(--color-border)",
            }}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="text-2xl font-bold"
                style={{ color: "var(--color-accent)" }}
              >
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            title="Change avatar"
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-accent)",
              border: "2px solid var(--color-bg)",
            }}
          >
            <Camera className="w-3 h-3" style={{ color: "#fff" }} />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div>
          <h1
            className="text-4xl tracking-wide"
            style={{
              fontFamily: '"Bebas Neue", cursive',
              color: "var(--color-text)",
            }}
          >
            My Dashboard
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Welcome back, {user?.name} &middot; {drillTotal} drill
            {drillTotal !== 1 ? "s" : ""} &middot; {sessionTotal} session
            {sessionTotal !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 mb-8 p-1 rounded-xl border"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
          width: "fit-content",
        }}
      >
        {[
          { key: "sessions", label: "My Sessions" },
          { key: "drills", label: "My Drills" },
          { key: "favourites", label: "Favourites" },
          { key: "analytics", label: "Analytics" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSearchParams({ tab: key })}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor:
                tab === key ? "var(--color-surface-2)" : "transparent",
              color:
                tab === key ? "var(--color-text)" : "var(--color-text-muted)",
              border:
                tab === key
                  ? "1px solid var(--color-border)"
                  : "1px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── My Sessions ── */}
      {tab === "sessions" && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-2xl tracking-wide"
              style={{
                fontFamily: '"Bebas Neue", cursive',
                color: "var(--color-text)",
              }}
            >
              My Sessions
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/sessions/new")}
            >
              <PlusCircle className="w-4 h-4" />
              New Session
            </Button>
          </div>

          {sessionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl animate-pulse"
                  style={{ backgroundColor: "var(--color-surface)" }}
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div
              className="text-center py-14 rounded-xl border"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <div className="text-4xl mb-3">📋</div>
              <p
                className="text-lg font-medium mb-2"
                style={{ color: "var(--color-text)" }}
              >
                No sessions yet
              </p>
              <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
                Create your first training session
              </p>
              <Button
                variant="primary"
                onClick={() => navigate("/sessions/new")}
              >
                <PlusCircle className="w-4 h-4" />
                Create Session
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card key={session.id} hoverable className="cursor-pointer">
                  <div className="flex items-center gap-4">
                    {/* Visibility indicator */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: session.is_public
                          ? "#cc141422"
                          : "#88888822",
                      }}
                      title={session.is_public ? "Public" : "Draft"}
                    >
                      {session.is_public ? (
                        <Eye
                          className="w-4 h-4"
                          style={{ color: "var(--color-accent)" }}
                        />
                      ) : (
                        <EyeOff
                          className="w-4 h-4"
                          style={{ color: "var(--color-text-muted)" }}
                        />
                      )}
                    </div>

                    {/* Main info */}
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => navigate(`/sessions/${session.id}`)}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className="font-semibold truncate"
                          style={{ color: "var(--color-text)" }}
                        >
                          {session.title}
                        </span>
                        {!session.is_public && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-mono"
                            style={{
                              backgroundColor: "#88888822",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            draft
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {session.skill_level && (
                          <Badge variant="skill">{session.skill_level}</Badge>
                        )}
                        {session.age_range && (
                          <Badge variant="age">{session.age_range}</Badge>
                        )}
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <Layers className="w-3 h-3" />
                          {session.drills?.length ?? 0} drills
                        </span>
                        {session.total_duration_minutes > 0 && (
                          <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            <Clock className="w-3 h-3" />
                            {session.total_duration_minutes} min
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/sessions/${session.id}/edit`);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deleteSession.isPending}
                        onClick={(e) => handleDeleteSession(e, session.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Favourites ── */}
      {tab === "favourites" && (
        <section className="mb-12">
          <h2
            className="text-2xl tracking-wide mb-4"
            style={{
              fontFamily: '"Bebas Neue", cursive',
              color: "var(--color-text)",
            }}
          >
            Favourite Drills
          </h2>
          {(favourites?.drills ?? []).length === 0 ? (
            <p
              style={{ color: "var(--color-text-muted)" }}
              className="text-sm mb-8"
            >
              No favourite drills yet. Bookmark drills to find them here.
            </p>
          ) : (
            <div className="space-y-3 mb-8">
              {(favourites?.drills ?? []).map((drill) => {
                const focusLabel =
                  FOCUS_AREAS.find((f) => f.value === drill.focus_area)
                    ?.label ?? drill.focus_area;
                return (
                  <Card
                    key={drill.id}
                    hoverable
                    className="cursor-pointer"
                    onClick={() => navigate(`/drills/${drill.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <span
                          className="font-semibold"
                          style={{ color: "var(--color-text)" }}
                        >
                          {drill.title}
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {drill.focus_area && (
                            <Badge variant="focus">{focusLabel}</Badge>
                          )}
                          {drill.skill_level && (
                            <Badge variant="skill">{drill.skill_level}</Badge>
                          )}
                          {drill.age_range && (
                            <Badge variant="age">{drill.age_range}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <h2
            className="text-2xl tracking-wide mb-4"
            style={{
              fontFamily: '"Bebas Neue", cursive',
              color: "var(--color-text)",
            }}
          >
            Favourite Sessions
          </h2>
          {(favourites?.sessions ?? []).length === 0 ? (
            <p style={{ color: "var(--color-text-muted)" }} className="text-sm">
              No favourite sessions yet. Bookmark sessions to find them here.
            </p>
          ) : (
            <div className="space-y-3">
              {(favourites?.sessions ?? []).map((session) => (
                <Card
                  key={session.id}
                  hoverable
                  className="cursor-pointer"
                  onClick={() => navigate(`/sessions/${session.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span
                        className="font-semibold"
                        style={{ color: "var(--color-text)" }}
                      >
                        {session.title}
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {session.skill_level && (
                          <Badge variant="skill">{session.skill_level}</Badge>
                        )}
                        {session.age_range && (
                          <Badge variant="age">{session.age_range}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Analytics ── */}
      {tab === "analytics" && (
        <section className="mb-12">
          <h2
            className="text-2xl tracking-wide mb-4"
            style={{
              fontFamily: '"Bebas Neue", cursive',
              color: "var(--color-text)",
            }}
          >
            Drill Analytics
          </h2>
          {!analyticsData || analyticsData.length === 0 ? (
            <div
              className="text-center py-14 rounded-xl border"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <div className="text-4xl mb-3">📊</div>
              <p style={{ color: "var(--color-text-muted)" }}>
                Create some drills to see analytics here.
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl border overflow-x-auto"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {[
                      { key: "title", label: "Drill" },
                      { key: "view_count", label: "Views" },
                      { key: "likes_count", label: "Likes" },
                      { key: "avg_rating", label: "Avg Rating" },
                      { key: "session_count", label: "In Sessions" },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left cursor-pointer hover:opacity-80 select-none"
                        onClick={() => {
                          if (analyticsSortKey === key) {
                            setAnalyticsSortAsc((a) => !a);
                          } else {
                            setAnalyticsSortKey(key);
                            setAnalyticsSortAsc(false);
                          }
                        }}
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        <span className="flex items-center gap-1">
                          {label}
                          {analyticsSortKey === key &&
                            (analyticsSortAsc ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            ))}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...analyticsData]
                    .sort((a, b) => {
                      const av = a[analyticsSortKey] ?? 0;
                      const bv = b[analyticsSortKey] ?? 0;
                      if (analyticsSortKey === "title") {
                        return analyticsSortAsc
                          ? av.localeCompare(bv)
                          : bv.localeCompare(av);
                      }
                      return analyticsSortAsc ? av - bv : bv - av;
                    })
                    .map((row, i) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer hover:opacity-80"
                        style={{
                          borderTop:
                            i > 0 ? "1px solid var(--color-border)" : undefined,
                        }}
                        onClick={() => navigate(`/drills/${row.id}`)}
                      >
                        <td
                          className="px-4 py-3 font-medium truncate max-w-xs"
                          style={{ color: "var(--color-text)" }}
                        >
                          {row.title}
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {row.view_count}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          ♥ {row.likes_count}
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {row.avg_rating != null
                            ? `★ ${row.avg_rating.toFixed(1)} (${
                                row.rating_count
                              })`
                            : "—"}
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {row.session_count}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── My Drills ── */}
      {tab === "drills" && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-2xl tracking-wide"
              style={{
                fontFamily: '"Bebas Neue", cursive',
                color: "var(--color-text)",
              }}
            >
              My Drills
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/drills/new")}
            >
              <PlusCircle className="w-4 h-4" />
              New Drill
            </Button>
          </div>

          {/* Filters */}
          <div
            className="mb-6 p-4 rounded-xl border"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <DrillFilters
              filters={drillFilters}
              onFiltersChange={setDrillFilters}
            />
          </div>

          {drillsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl animate-pulse"
                  style={{ backgroundColor: "var(--color-surface)" }}
                />
              ))}
            </div>
          ) : drills.length === 0 ? (
            <div
              className="text-center py-14 rounded-xl border"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <div className="text-4xl mb-3">📋</div>
              <p
                className="text-lg font-medium mb-2"
                style={{ color: "var(--color-text)" }}
              >
                No drills yet
              </p>
              <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
                Create your first drill to get started
              </p>
              <Button variant="primary" onClick={() => navigate("/drills/new")}>
                <PlusCircle className="w-4 h-4" />
                Create Drill
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {drills.map((drill) => {
                const focusLabel =
                  FOCUS_AREAS.find((f) => f.value === drill.focus_area)
                    ?.label ?? drill.focus_area;
                return (
                  <Card key={drill.id} hoverable className="cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: drill.is_public
                            ? "#cc141422"
                            : "#88888822",
                        }}
                        title={drill.is_public ? "Public" : "Draft"}
                      >
                        {drill.is_public ? (
                          <Eye
                            className="w-4 h-4"
                            style={{ color: "var(--color-accent)" }}
                          />
                        ) : (
                          <EyeOff
                            className="w-4 h-4"
                            style={{ color: "var(--color-text-muted)" }}
                          />
                        )}
                      </div>

                      <div
                        className="flex-1 min-w-0"
                        onClick={() => navigate(`/drills/${drill.id}`)}
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className="font-semibold truncate"
                            style={{ color: "var(--color-text)" }}
                          >
                            {drill.title}
                          </span>
                          {!drill.is_public && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-mono"
                              style={{
                                backgroundColor: "#88888822",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              draft
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {drill.focus_area && (
                            <Badge variant="focus">{focusLabel}</Badge>
                          )}
                          {drill.skill_level && (
                            <Badge variant="skill">{drill.skill_level}</Badge>
                          )}
                          {drill.age_range && (
                            <Badge variant="age">{drill.age_range}</Badge>
                          )}
                          {drill.duration_minutes && (
                            <span
                              className="text-xs"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              {drill.duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/drills/${drill.id}/edit`);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deleteDrill.isPending}
                          onClick={(e) => handleDeleteDrill(e, drill.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
