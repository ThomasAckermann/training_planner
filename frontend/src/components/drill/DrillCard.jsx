import { useNavigate } from "react-router-dom";
import { Clock, Users } from "lucide-react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import { FOCUS_AREAS } from "../../lib/constants.js";

export default function DrillCard({ drill }) {
  const navigate = useNavigate();

  const focusLabel =
    FOCUS_AREAS.find((f) => f.value === drill.focus_area)?.label ??
    drill.focus_area;

  const playerRange =
    drill.num_players_min && drill.num_players_max
      ? `${drill.num_players_min}–${drill.num_players_max}`
      : drill.num_players_min
        ? `${drill.num_players_min}+`
        : drill.num_players_max
          ? `≤${drill.num_players_max}`
          : null;

  return (
    <Card hoverable onClick={() => navigate(`/drills/${drill.id}`)}>
      {/* Thumbnail */}
      {drill.drawing_thumb_url && (
        <div className="mb-3 rounded-lg overflow-hidden h-32 bg-surface2">
          <img
            src={drill.drawing_thumb_url}
            alt={`${drill.title} diagram`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.parentElement.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {drill.focus_area && <Badge variant="focus">{focusLabel}</Badge>}
        {drill.skill_level && (
          <Badge variant="skill">{drill.skill_level}</Badge>
        )}
        {drill.age_range && <Badge variant="age">{drill.age_range}</Badge>}
      </div>

      {/* Title */}
      <h3
        className="font-semibold text-base mb-1 leading-tight"
        style={{
          color: "var(--color-text-primary)",
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        {drill.title}
      </h3>

      {/* Description */}
      {drill.description && (
        <p
          className="text-sm mb-3 line-clamp-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          {drill.description}
        </p>
      )}

      {/* Meta row */}
      <div
        className="flex items-center gap-4 text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        {drill.duration_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {drill.duration_minutes} min
          </span>
        )}
        {playerRange && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {playerRange} players
          </span>
        )}
        {drill.likes_count > 0 && (
          <span className="flex items-center gap-1">
            ♥ {drill.likes_count}
          </span>
        )}
      </div>
    </Card>
  );
}
