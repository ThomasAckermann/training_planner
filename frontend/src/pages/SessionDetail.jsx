import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Clock,
  Layers,
  Users,
  Heart,
  Copy,
  FileDown,
} from "lucide-react";
import {
  useSession,
  useDeleteSession,
  useLikeSession,
  useDuplicateSession,
} from "../hooks/useSessions.js";
import useAuthStore from "../store/authStore.js";
import SessionDrillList from "../components/session/SessionDrillList.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import { FOCUS_AREAS } from "../lib/constants.js";

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const { data: session, isLoading, isError } = useSession(id);
  const deleteSession = useDeleteSession();
  const likeSession = useLikeSession();
  const duplicateSession = useDuplicateSession();

  const isOwner = currentUser?.id === session?.user_id;

  async function handleDelete() {
    if (!confirm("Delete this session? This action cannot be undone.")) return;
    await deleteSession.mutateAsync(id);
    navigate("/me");
  }

  async function handleLike() {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    await likeSession.mutateAsync(id);
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div
            className="h-8 w-32 rounded"
            style={{ backgroundColor: "var(--color-surface)" }}
          />
          <div
            className="h-12 w-2/3 rounded"
            style={{ backgroundColor: "var(--color-surface)" }}
          />
          <div
            className="h-48 rounded-xl"
            style={{ backgroundColor: "var(--color-surface)" }}
          />
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p style={{ color: "var(--color-danger)" }}>
          Session not found or access denied.
        </p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => navigate("/explore")}
        >
          Browse Sessions
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <button
        className="flex items-center gap-1 text-sm mb-6 hover:underline"
        style={{ color: "var(--color-text-muted)" }}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-6">
        {/* Draft badge */}
        {!session.is_public && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono mb-2"
            style={{
              backgroundColor: "#88888822",
              color: "var(--color-text-muted)",
              border: "1px solid #333333",
            }}
          >
            draft — not published
          </span>
        )}

        <h1
          className="text-5xl mb-3 tracking-wide leading-tight"
          style={{
            fontFamily: '"Bebas Neue", cursive',
            color: "var(--color-text)",
          }}
        >
          {session.title}
        </h1>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {session.skill_level && (
            <Badge variant="skill">{session.skill_level}</Badge>
          )}
          {session.age_range && (
            <Badge variant="age">{session.age_range}</Badge>
          )}
          {(session.focus_areas ?? []).map((fa) => (
            <Badge key={fa} variant="focus">
              {FOCUS_AREAS.find((f) => f.value === fa)?.label ?? fa}
            </Badge>
          ))}
          {(session.tags ?? []).map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div
          className="flex flex-wrap items-center gap-6 text-sm mb-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            {session.drills?.length ?? 0} drills
          </span>
          {session.total_duration_minutes > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {session.total_duration_minutes} min total
            </span>
          )}
          {session.team_size && (
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {session.team_size} players
            </span>
          )}
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/sessions/${id}/edit`)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Session
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteSession.isPending}
              onClick={handleDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        )}

        {/* Description */}
        {session.description && (
          <div
            className="p-4 rounded-xl border mb-6"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <p
              className="text-sm leading-relaxed"
              style={{
                color: "var(--color-text)",
                fontFamily: '"Lora", serif',
              }}
            >
              {session.description}
            </p>
          </div>
        )}
      </div>

      {/* Drill list */}
      <div className="mb-8">
        <h2
          className="text-2xl mb-4 tracking-wide"
          style={{
            fontFamily: '"Bebas Neue", cursive',
            color: "var(--color-text)",
          }}
        >
          Training Program
        </h2>
        <SessionDrillList
          drills={session.drills ?? []}
          sessionId={id}
          isOwner={isOwner}
        />
      </div>

      {/* Like + Duplicate + PDF buttons */}
      <div
        className="flex items-center justify-center gap-3 pt-4 border-t flex-wrap"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Button
          variant="secondary"
          onClick={handleLike}
          loading={likeSession.isPending}
          className="flex items-center gap-2"
        >
          <Heart className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
          {session.likes_count > 0
            ? `${session.likes_count} Likes`
            : "Like this session"}
        </Button>
        {currentUser && !isOwner && (
          <Button
            variant="secondary"
            loading={duplicateSession.isPending}
            onClick={async () => {
              await duplicateSession.mutateAsync(id);
              navigate("/me?tab=sessions");
            }}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Duplicate Session
          </Button>
        )}
        <a href={`/api/sessions/${id}/export/pdf`} download>
          <Button variant="secondary" className="flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            Export PDF
          </Button>
        </a>
      </div>
    </div>
  );
}
