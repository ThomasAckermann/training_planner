import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Layers,
  MapPin,
  Trophy,
  UserPlus,
  UserCheck,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from "lucide-react";
import { useUserProfile, useFollow } from "../hooks/useUsers.js";
import { useDrills, useMyDrills, useDeleteDrill } from "../hooks/useDrills.js";
import {
  useSessions,
  useMySessions,
  useDeleteSession,
} from "../hooks/useSessions.js";
import { useModules, useMyModules } from "../hooks/useModules.js";
import useAuthStore from "../store/authStore.js";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import { FOCUS_AREAS } from "../lib/constants.js";

const COACHING_LEVEL_LABELS = {
  C: "C License",
  B: "B License",
  A: "A License",
  national: "National License",
};

const PHASE_LABELS = {
  WARMUP: "Warm-up",
  MAIN: "Main Part",
  GAME: "Game",
  COOLDOWN: "Cool-down",
};

const PHASE_COLORS = {
  WARMUP: {
    bg: "#c8f13522",
    border: "#c8f13566",
    color: "var(--color-accent)",
  },
  MAIN: { bg: "#4a9eff22", border: "#4a9eff66", color: "#4a9eff" },
  GAME: { bg: "#00d68f22", border: "#00d68f66", color: "var(--color-success)" },
  COOLDOWN: {
    bg: "#7a849922",
    border: "#7a849966",
    color: "var(--color-text-muted)",
  },
};

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("sessions");
  const currentUser = useAuthStore((state) => state.user);

  const isOwnProfile = currentUser?.id === userId;

  const {
    data: profile,
    isLoading: profileLoading,
    isError,
  } = useUserProfile(userId);
  const follow = useFollow(userId);

  const { data: publicDrillData, isLoading: publicDrillsLoading } = useDrills({
    author_id: userId,
    limit: 50,
  });
  const { data: myDrillData, isLoading: myDrillsLoading } = useMyDrills({
    limit: 50,
  });
  const { data: publicSessionData, isLoading: publicSessionsLoading } =
    useSessions({ author_id: userId, limit: 50 });
  const { data: mySessionData, isLoading: mySessionsLoading } = useMySessions({
    limit: 50,
  });
  const { data: publicModuleData, isLoading: publicModulesLoading } =
    useModules({ author_id: userId, limit: 50 });
  const { data: myModuleData, isLoading: myModulesLoading } = useMyModules();

  const deleteDrill = useDeleteDrill();
  const deleteSession = useDeleteSession();

  const drillData = isOwnProfile ? myDrillData : publicDrillData;
  const drillsLoading = isOwnProfile ? myDrillsLoading : publicDrillsLoading;
  const sessionData = isOwnProfile ? mySessionData : publicSessionData;
  const sessionsLoading = isOwnProfile
    ? mySessionsLoading
    : publicSessionsLoading;
  const modulesLoading = isOwnProfile ? myModulesLoading : publicModulesLoading;

  const drills = drillData?.items ?? [];
  const sessions = sessionData?.items ?? [];
  const rawModules = isOwnProfile
    ? myModuleData ?? []
    : publicModuleData?.items ?? [];

  async function handleDeleteDrill(e, id) {
    e.stopPropagation();
    if (!confirm("Delete this drill? This action cannot be undone.")) return;
    try {
      await deleteDrill.mutateAsync(id);
    } catch {
      // error toast handled in hook
    }
  }

  async function handleDeleteSession(e, id) {
    e.stopPropagation();
    if (!confirm("Delete this session? This action cannot be undone.")) return;
    try {
      await deleteSession.mutateAsync(id);
    } catch {
      // error toast handled in hook
    }
  }

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div
          className="h-6 w-24 rounded"
          style={{ backgroundColor: "var(--color-surface)" }}
        />
        <div
          className="h-24 rounded-2xl"
          style={{ backgroundColor: "var(--color-surface)" }}
        />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl mb-2" style={{ color: "var(--color-text)" }}>
          Coach not found
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm mt-4"
          style={{ color: "var(--color-text-muted)" }}
        >
          ← Go back
        </button>
      </div>
    );
  }

  const joinYear = new Date(profile.created_at).getFullYear();
  const publicModules = rawModules.filter((m) => m.is_public || isOwnProfile);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm mb-6 hover:opacity-80 transition-opacity"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Profile header */}
      <div
        className="p-6 rounded-2xl border mb-8 flex items-start gap-5"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: "2px solid var(--color-border)",
          }}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="text-3xl font-bold"
              style={{
                fontFamily: '"Bebas Neue", cursive',
                color: "var(--color-accent)",
              }}
            >
              {profile.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-4xl tracking-wide mb-1"
            style={{
              fontFamily: '"Bebas Neue", cursive',
              color: "var(--color-text)",
            }}
          >
            {profile.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {(profile.club || profile.country) && (
              <span
                className="flex items-center gap-1 text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {[profile.club, profile.country].filter(Boolean).join(" · ")}
              </span>
            )}
            {profile.coaching_level && (
              <span
                className="flex items-center gap-1 text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                <Trophy className="w-3.5 h-3.5" />
                {COACHING_LEVEL_LABELS[profile.coaching_level] ??
                  profile.coaching_level}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{
                  fontFamily: '"Bebas Neue", cursive',
                  color: "var(--color-accent)",
                }}
              >
                {sessionData?.total ?? sessions.length ?? "—"}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Sessions
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{
                  fontFamily: '"Bebas Neue", cursive',
                  color: "var(--color-accent)",
                }}
              >
                {drillData?.total ?? drills.length ?? "—"}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Drills
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{
                  fontFamily: '"Bebas Neue", cursive',
                  color: "var(--color-accent)",
                }}
              >
                {profile.follower_count ?? 0}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Followers
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{
                  fontFamily: '"Bebas Neue", cursive',
                  color: "var(--color-accent)",
                }}
              >
                {profile.following_count ?? 0}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Following
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{
                  fontFamily: '"Bebas Neue", cursive',
                  color: "var(--color-accent)",
                }}
              >
                {joinYear}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Joined
              </div>
            </div>
          </div>

          {/* Follow button — only for other users */}
          {currentUser && !isOwnProfile && (
            <div className="mt-4">
              <Button
                variant={profile.is_following ? "secondary" : "primary"}
                size="sm"
                loading={follow.isPending}
                onClick={() => follow.mutate()}
                className="flex items-center gap-1.5"
              >
                {profile.is_following ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl border overflow-x-auto"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
          width: "fit-content",
          maxWidth: "100%",
        }}
      >
        {[
          { key: "sessions", label: "Sessions" },
          { key: "drills", label: "Drills" },
          { key: "modules", label: "Modules" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
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

      {/* Sessions tab */}
      {tab === "sessions" && (
        <div>
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
              <p
                className="text-lg"
                style={{ color: "var(--color-text-muted)" }}
              >
                {isOwnProfile ? "No sessions yet" : "No public sessions yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card key={session.id} hoverable className="cursor-pointer">
                  <div className="flex flex-wrap items-center gap-3">
                    {isOwnProfile && (
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
                    )}
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => navigate(`/sessions/${session.id}`)}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p
                          className="font-semibold truncate"
                          style={{ color: "var(--color-text)" }}
                        >
                          {session.title}
                        </p>
                        {isOwnProfile && !session.is_public && (
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
                    {isOwnProfile && (
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
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drills tab */}
      {tab === "drills" && (
        <div>
          {drillsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
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
              <p
                className="text-lg"
                style={{ color: "var(--color-text-muted)" }}
              >
                {isOwnProfile ? "No drills yet" : "No public drills yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drills.map((drill) => {
                const focusLabel =
                  FOCUS_AREAS.find((f) => f.value === drill.focus_area)
                    ?.label ?? drill.focus_area;
                return (
                  <Card key={drill.id} hoverable className="cursor-pointer">
                    <div className="flex flex-wrap items-center gap-3">
                      {isOwnProfile && (
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
                      )}
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => navigate(`/drills/${drill.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          {drill.drawing_thumb_url && (
                            <img
                              src={drill.drawing_thumb_url}
                              alt=""
                              className="w-14 h-10 rounded object-cover flex-shrink-0"
                              style={{
                                border: "1px solid var(--color-border)",
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p
                                className="font-semibold truncate"
                                style={{ color: "var(--color-text)" }}
                              >
                                {drill.title}
                              </p>
                              {isOwnProfile && !drill.is_public && (
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
                              {drill.focus_area && (
                                <Badge variant="focus">{focusLabel}</Badge>
                              )}
                              {drill.skill_level && (
                                <Badge variant="skill">
                                  {drill.skill_level}
                                </Badge>
                              )}
                              {drill.age_range && (
                                <Badge variant="age">{drill.age_range}</Badge>
                              )}
                              {drill.duration_minutes && (
                                <span
                                  className="flex items-center gap-1 text-xs"
                                  style={{ color: "var(--color-text-muted)" }}
                                >
                                  <Clock className="w-3 h-3" />
                                  {drill.duration_minutes} min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {isOwnProfile && (
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
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modules tab */}
      {tab === "modules" && (
        <div>
          {modulesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl animate-pulse"
                  style={{ backgroundColor: "var(--color-surface)" }}
                />
              ))}
            </div>
          ) : publicModules.length === 0 ? (
            <div
              className="text-center py-14 rounded-xl border"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <p
                className="text-lg"
                style={{ color: "var(--color-text-muted)" }}
              >
                {isOwnProfile ? "No modules yet" : "No public modules yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {publicModules.map((module) => {
                const colors =
                  PHASE_COLORS[module.phase_type] ?? PHASE_COLORS.MAIN;
                return (
                  <Card key={module.id} hoverable>
                    <div className="flex items-center gap-4">
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => navigate(`/modules/${module.id}/edit`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p
                            className="font-semibold truncate"
                            style={{ color: "var(--color-text)" }}
                          >
                            {module.title}
                          </p>
                          <span
                            className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: colors.bg,
                              border: `1px solid ${colors.border}`,
                              color: colors.color,
                            }}
                          >
                            {PHASE_LABELS[module.phase_type] ??
                              module.phase_type}
                          </span>
                          {isOwnProfile && !module.is_public && (
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
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <Layers className="w-3 h-3" />
                          {module.drills?.length ?? 0} drills
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
