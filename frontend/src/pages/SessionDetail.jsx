import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Pencil,
  Trash2,
  Clock,
  Layers,
  Users,
  Heart,
  Copy,
  FileDown,
  PlayCircle,
} from "lucide-react";
import {
  useSession,
  useDeleteSession,
  useLikeSession,
  useDuplicateSession,
} from "../hooks/useSessions.js";
import { useFavouriteSession } from "../hooks/useFavourites.js";
import {
  useSessionComments,
  useCreateSessionComment,
  useDeleteComment,
} from "../hooks/useComments.js";
import useAuthStore from "../store/authStore.js";
import { useUserProfile } from "../hooks/useUsers.js";
import SessionDrillList from "../components/session/SessionDrillList.jsx";
import SessionTimeline from "../components/session/SessionTimeline.jsx";
import SkillCoverageChart from "../components/session/SkillCoverageChart.jsx";
import CommentThread from "../components/common/CommentThread.jsx";
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
  const { data: author } = useUserProfile(session?.user_id);
  const favouriteSession = useFavouriteSession();
  const { data: comments } = useSessionComments(id);
  const createComment = useCreateSessionComment(id);
  const deleteComment = useDeleteComment(["comments", "session", id]);

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

        {/* Author */}
        {author && (
          <p
            className="text-sm mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            By{" "}
            <Link
              to={`/profile/${session.user_id}`}
              className="hover:underline"
              style={{ color: "var(--color-accent)" }}
            >
              {author.name}
            </Link>
          </p>
        )}

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

      {/* Timeline + Coverage */}
      {(session.drills?.length ?? 0) > 0 && (
        <>
          <SessionTimeline drills={session.drills} />
          <SkillCoverageChart drills={session.drills} />
        </>
      )}

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
        {(session.drills?.length ?? 0) > 0 && (
          <Button
            variant="primary"
            onClick={() => navigate(`/sessions/${id}/coach`)}
            className="flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            Start Coaching
          </Button>
        )}
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
        {currentUser && (
          <Button
            variant="secondary"
            onClick={() => favouriteSession.mutate(id)}
            loading={favouriteSession.isPending}
            className="flex items-center gap-2"
          >
            <Bookmark
              className="w-4 h-4"
              style={{ color: "var(--color-accent)" }}
            />
            Bookmark
          </Button>
        )}
        <a href={`/api/sessions/${id}/export/pdf`} download>
          <Button variant="secondary" className="flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            Export PDF
          </Button>
        </a>
      </div>

      {/* Comments */}
      <div
        className="mt-10 pt-8 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <CommentThread
          comments={comments ?? []}
          onPost={(body) => createComment.mutate({ body })}
          onDelete={(commentId) => deleteComment.mutate(commentId)}
          onReply={(parentId, body) =>
            createComment.mutate({ body, parent_id: parentId })
          }
          isPosting={createComment.isPending}
          contentOwnerId={session.user_id}
        />
      </div>
    </div>
  );
}
