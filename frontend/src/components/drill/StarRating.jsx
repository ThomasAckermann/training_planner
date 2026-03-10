import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  avgRating,
  ratingCount,
  onRate,
  loading = false,
  size = "md",
}) {
  const [hovered, setHovered] = useState(0);

  const starSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const interactive = Boolean(onRate) && !loading;

  function getStarFill(starIndex) {
    const val = hovered || avgRating || 0;
    return starIndex <= val ? "var(--color-accent)" : "var(--color-border)";
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            style={{ background: "none", border: "none", padding: "1px" }}
          >
            <Star
              className={starSize}
              style={{
                fill: getStarFill(star),
                color: getStarFill(star),
                transition: "fill 0.1s, color 0.1s",
              }}
            />
          </button>
        ))}
      </div>
      {ratingCount > 0 && (
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {avgRating?.toFixed(1)} ({ratingCount})
        </span>
      )}
      {ratingCount === 0 && onRate && (
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Be the first to rate
        </span>
      )}
    </div>
  );
}
