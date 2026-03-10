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

// The five core volleyball skills that should ideally be covered
const CORE_SKILLS = ["SERVING", "RECEPTION", "SETTING", "ATTACK", "DEFENSE"];

export default function SkillCoverageChart({ drills }) {
  if (!drills || drills.length === 0) return null;

  // Aggregate minutes by focus area
  const coverage = {};
  for (const drill of drills) {
    const area = drill.focus_area;
    if (!area) continue;
    const dur = drill.duration_override ?? drill.duration_minutes ?? 0;
    coverage[area] = (coverage[area] ?? 0) + dur;
  }

  const entries = Object.entries(coverage).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  const maxMinutes = Math.max(...entries.map(([, v]) => v));

  const missingCore = CORE_SKILLS.filter((s) => !coverage[s]);

  const focusLabel = (area) =>
    FOCUS_AREAS.find((f) => f.value === area)?.label ?? area;

  return (
    <div
      className="p-4 rounded-xl border mb-8"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <h2
        className="text-xl mb-4 tracking-wide"
        style={{
          fontFamily: '"Bebas Neue", cursive',
          color: "var(--color-text)",
        }}
      >
        Skill Coverage
      </h2>

      <div className="space-y-3">
        {entries.map(([area, minutes]) => {
          const pct = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0;
          return (
            <div key={area} className="flex items-center gap-3">
              <div
                className="text-xs w-20 flex-shrink-0 text-right"
                style={{
                  color: "var(--color-text-muted)",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {focusLabel(area)}
              </div>
              <div
                className="flex-1 rounded-full overflow-hidden"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  height: "10px",
                }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor:
                      FOCUS_COLORS[area] ?? "var(--color-accent)",
                  }}
                />
              </div>
              <div
                className="text-xs w-12 flex-shrink-0"
                style={{
                  color: "var(--color-text-muted)",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {minutes}min
              </div>
            </div>
          );
        })}
      </div>

      {missingCore.length > 0 && (
        <div
          className="mt-4 px-3 py-2 rounded-lg flex flex-wrap gap-1.5 items-center text-xs"
          style={{
            backgroundColor: "#ff950015",
            border: "1px solid #ff950040",
            color: "#ff9500",
          }}
        >
          <span className="font-semibold">No coverage:</span>
          {missingCore.map((s) => (
            <span key={s}>{focusLabel(s)}</span>
          ))}
        </div>
      )}
    </div>
  );
}
