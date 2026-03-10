import { useState } from "react";
import { FOCUS_AREAS } from "../../lib/constants.js";

const FOCUS_COLORS = {
  SERVING: "#ff9500",
  RECEPTION: "#4a9eff",
  SETTING: "#c8f135",
  ATTACK: "#ff4d6d",
  BLOCK: "#00d68f",
  DEFENSE: "#b388ff",
  TACTICS: "#80deea",
  FITNESS: "#ffcc02",
  WARMUP: "#ff7043",
  FUN: "#a5d6a7",
};

function getColor(focusArea) {
  return FOCUS_COLORS[focusArea] ?? "var(--color-surface-2)";
}

export default function SessionTimeline({ drills }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const drillsWithDuration = drills.map((d) => ({
    ...d,
    effectiveDuration: d.duration_override ?? d.duration_minutes ?? 0,
  }));

  const totalDuration = drillsWithDuration.reduce(
    (sum, d) => sum + d.effectiveDuration,
    0,
  );

  if (totalDuration === 0 || drills.length === 0) return null;

  const focusLabel = (area) =>
    FOCUS_AREAS.find((f) => f.value === area)?.label ?? area;

  return (
    <div className="mb-8">
      <h2
        className="text-xl mb-3 tracking-wide"
        style={{
          fontFamily: '"Bebas Neue", cursive',
          color: "var(--color-text)",
        }}
      >
        Practice Timeline
      </h2>

      {/* Bar */}
      <div
        className="flex rounded-lg overflow-hidden h-10 relative"
        style={{ border: "1px solid var(--color-border)" }}
      >
        {drillsWithDuration.map((drill, idx) => {
          const widthPct =
            totalDuration > 0
              ? (drill.effectiveDuration / totalDuration) * 100
              : 0;
          return (
            <div
              key={drill.drill_session_id ?? idx}
              className="relative flex items-center justify-center cursor-default transition-opacity"
              style={{
                width: `${widthPct}%`,
                backgroundColor: getColor(drill.focus_area),
                opacity: hoveredIdx !== null && hoveredIdx !== idx ? 0.5 : 1,
                minWidth: widthPct > 0 ? "2px" : 0,
                borderRight:
                  idx < drillsWithDuration.length - 1
                    ? "1px solid rgba(0,0,0,0.2)"
                    : "none",
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {widthPct > 8 && (
                <span
                  className="text-xs font-medium truncate px-1"
                  style={{ color: "#000", opacity: 0.75, fontSize: "0.65rem" }}
                >
                  {drill.title}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip / label */}
      {hoveredIdx !== null && drillsWithDuration[hoveredIdx] && (
        <div
          className="mt-2 px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <span className="font-semibold">
            {drillsWithDuration[hoveredIdx].title}
          </span>
          {drillsWithDuration[hoveredIdx].focus_area && (
            <span
              className="ml-2 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {focusLabel(drillsWithDuration[hoveredIdx].focus_area)}
            </span>
          )}
          <span
            className="ml-2 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {drillsWithDuration[hoveredIdx].effectiveDuration} min
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {drillsWithDuration.map((drill, idx) => (
          <div
            key={drill.drill_session_id ?? idx}
            className="flex items-center gap-1.5"
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: getColor(drill.focus_area) }}
            />
            <span
              className="text-xs truncate max-w-[120px]"
              style={{ color: "var(--color-text-muted)" }}
              title={drill.title}
            >
              {drill.title}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)", opacity: 0.6 }}
            >
              {drill.effectiveDuration}min
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
