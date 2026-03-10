import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Clock,
  ExternalLink,
  Heart,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import {
  useDrill,
  useDeleteDrill,
  useLikeDrill,
  useRateDrill,
} from "../hooks/useDrills.js";
import { useFavouriteDrill } from "../hooks/useFavourites.js";
import { useUserProfile } from "../hooks/useUsers.js";
import StarRating from "../components/drill/StarRating.jsx";
import {
  useDrillComments,
  useCreateDrillComment,
  useDeleteComment,
} from "../hooks/useComments.js";
import useAuthStore from "../store/authStore.js";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import CommentThread from "../components/common/CommentThread.jsx";
import { FOCUS_AREAS } from "../lib/constants.js";

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  );
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return null;
}

export default function DrillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: drill, isLoading, isError } = useDrill(id);
  const deleteDrill = useDeleteDrill();
  const likeDrill = useLikeDrill();

  const isOwner = user && drill && user.id === drill.user_id;
  const embedUrl = getYouTubeEmbedUrl(drill?.video_url);
  const { data: author } = useUserProfile(drill?.user_id);
  const rateDrill = useRateDrill();
  const focusLabel =
    FOCUS_AREAS.find((f) => f.value === drill?.focus_area)?.label ??
    drill?.focus_area;
  const favouriteDrill = useFavouriteDrill();
  const { data: comments } = useDrillComments(id);
  const createComment = useCreateDrillComment(id);
  const deleteComment = useDeleteComment(["comments", "drill", id]);

  async function handleDelete() {
    if (!confirm("Delete this drill? This action cannot be undone.")) return;
    await deleteDrill.mutateAsync(id);
    navigate("/explore");
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-8 w-32 bg-surface rounded" />
        <div className="h-10 w-2/3 bg-surface rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-surface rounded-full" />
          <div className="h-6 w-24 bg-surface rounded-full" />
        </div>
        <div className="h-40 w-full bg-surface rounded-xl" />
      </div>
    );
  }

  if (isError || !drill) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-danger text-lg mb-4">Drill not found</p>
        <Button variant="secondary" onClick={() => navigate("/explore")}>
          Back to Explore
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 mb-6 text-sm transition-colors hover:text-accent"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {drill.focus_area && <Badge variant="focus">{focusLabel}</Badge>}
          {drill.skill_level && (
            <Badge variant="skill">{drill.skill_level}</Badge>
          )}
          {drill.age_range && <Badge variant="age">{drill.age_range}</Badge>}
          {!drill.is_public && <Badge>Draft</Badge>}
        </div>
        <h1
          className="text-4xl sm:text-5xl mb-4"
          style={{
            fontFamily: '"Bebas Neue", cursive',
            color: "var(--color-text)",
          }}
        >
          {drill.title}
        </h1>

        {/* Author */}
        {author && (
          <p
            className="text-sm mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            By{" "}
            <Link
              to={`/profile/${drill.user_id}`}
              className="hover:underline"
              style={{ color: "var(--color-accent)" }}
            >
              {author.name}
            </Link>
          </p>
        )}

        {/* Actions row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Like button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => likeDrill.mutate(id)}
            loading={likeDrill.isPending}
            className="gap-1.5"
          >
            <Heart
              className="w-4 h-4"
              style={{ color: "var(--color-danger)" }}
            />
            <span>{drill.likes_count}</span>
          </Button>

          {/* Favourite button */}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => favouriteDrill.mutate(id)}
              loading={favouriteDrill.isPending}
              className="gap-1.5"
              title="Bookmark this drill"
            >
              <Bookmark
                className="w-4 h-4"
                style={{ color: "var(--color-accent)" }}
              />
            </Button>
          )}

          {isOwner && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/drills/${id}/edit`)}
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={deleteDrill.isPending}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </>
          )}
        </div>

        {/* Star rating */}
        <div className="mt-3">
          <StarRating
            avgRating={drill.avg_rating}
            ratingCount={drill.rating_count}
            onRate={user ? (score) => rateDrill.mutate({ id, score }) : null}
            loading={rateDrill.isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tactical drawing */}
          {drill.drawing_thumb_url && (
            <Card>
              <h2
                className="text-lg font-semibold mb-3"
                style={{ color: "var(--color-text-primary)" }}
              >
                Tactical Diagram
              </h2>
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--color-border)" }}
              >
                <img
                  src={drill.drawing_thumb_url}
                  alt="Tactical diagram"
                  className="w-full"
                  style={{ display: "block" }}
                />
              </div>
            </Card>
          )}

          {/* Description */}
          {drill.description && (
            <Card>
              <h2
                className="text-lg font-semibold mb-3"
                style={{ color: "var(--color-text-primary)" }}
              >
                Description
              </h2>
              <p
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{
                  color: "var(--color-text-muted)",
                  fontFamily: "Lora, serif",
                }}
              >
                {drill.description}
              </p>
            </Card>
          )}

          {/* Video */}
          {embedUrl && (
            <Card>
              <h2
                className="text-lg font-semibold mb-3"
                style={{ color: "var(--color-text-primary)" }}
              >
                Video Demo
              </h2>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={embedUrl}
                  title="Drill video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </Card>
          )}

          {drill.video_url && !embedUrl && (
            <Card>
              <h2
                className="text-lg font-semibold mb-3"
                style={{ color: "var(--color-text-primary)" }}
              >
                Video
              </h2>
              <a
                href={drill.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-accent2 hover:underline text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Watch video
              </a>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3
              className="text-sm font-semibold mb-3 uppercase tracking-wider"
              style={{
                color: "var(--color-text-muted)",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              Details
            </h3>
            <div className="space-y-3">
              {drill.duration_minutes && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock
                    className="w-4 h-4"
                    style={{ color: "var(--color-accent)" }}
                  />
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Duration
                  </span>
                  <span
                    className="ml-auto font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {drill.duration_minutes} min
                  </span>
                </div>
              )}
              {(drill.num_players_min || drill.num_players_max) && (
                <div className="flex items-center gap-2 text-sm">
                  <Users
                    className="w-4 h-4"
                    style={{ color: "var(--color-accent)" }}
                  />
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Players
                  </span>
                  <span
                    className="ml-auto font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {drill.num_players_min && drill.num_players_max
                      ? `${drill.num_players_min}–${drill.num_players_max}`
                      : drill.num_players_min
                        ? `${drill.num_players_min}+`
                        : `≤${drill.num_players_max}`}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {drill.equipment && drill.equipment.length > 0 && (
            <Card>
              <h3
                className="text-sm font-semibold mb-3 uppercase tracking-wider"
                style={{
                  color: "var(--color-text-muted)",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                Equipment
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {drill.equipment.map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
            </Card>
          )}

          {drill.skill_tags && drill.skill_tags.length > 0 && (
            <Card>
              <h3
                className="text-sm font-semibold mb-3 uppercase tracking-wider"
                style={{
                  color: "var(--color-text-muted)",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {drill.skill_tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
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
          contentOwnerId={drill.user_id}
        />
      </div>
    </div>
  );
}
