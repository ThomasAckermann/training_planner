import { useNavigate } from "react-router-dom";
import { Layers, Heart, Bookmark } from "lucide-react";
import Card from "../ui/Card.jsx";
import { useLikeModule, useFavouriteModule } from "../../hooks/useModules.js";
import useAuthStore from "../../store/authStore.js";

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

export default function ModuleCard({ module }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const likeModule = useLikeModule();
  const favouriteModule = useFavouriteModule();

  const colors = PHASE_COLORS[module.phase_type] ?? PHASE_COLORS.MAIN;

  function handleLike(e) {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    likeModule.mutate(module.id);
  }

  function handleFavourite(e) {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    favouriteModule.mutate(module.id);
  }

  return (
    <Card hoverable onClick={() => navigate(`/modules/${module.id}/edit`)}>
      {/* Phase badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.color,
          }}
        >
          {PHASE_LABELS[module.phase_type] ?? module.phase_type}
        </span>
      </div>

      {/* Title */}
      <h3
        className="font-semibold text-base mb-1 leading-tight"
        style={{
          color: "var(--color-text-primary)",
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        {module.title}
      </h3>

      {/* Description */}
      {module.description && (
        <p
          className="text-sm mb-3 line-clamp-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          {module.description}
        </p>
      )}

      {/* Meta row */}
      <div
        className="flex items-center justify-between text-xs mt-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          {module.drills?.length ?? 0} drill
          {(module.drills?.length ?? 0) !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 transition-opacity hover:opacity-80"
            style={{
              color: module.is_liked
                ? "var(--color-danger)"
                : "var(--color-text-muted)",
            }}
            aria-label="Like module"
          >
            <Heart
              className="w-3.5 h-3.5"
              fill={module.is_liked ? "currentColor" : "none"}
            />
            {module.likes_count > 0 && <span>{module.likes_count}</span>}
          </button>
          <button
            onClick={handleFavourite}
            className="flex items-center gap-1 transition-opacity hover:opacity-80"
            style={{
              color: module.is_favourited
                ? "var(--color-accent)"
                : "var(--color-text-muted)",
            }}
            aria-label="Save module"
          >
            <Bookmark
              className="w-3.5 h-3.5"
              fill={module.is_favourited ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>
    </Card>
  );
}
