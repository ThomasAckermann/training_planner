import { useState, useEffect } from "react";
import { X, Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useDrills, useMyDrills } from "../../hooks/useDrills.js";
import { useAddDrillToSession } from "../../hooks/useSessions.js";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import { FOCUS_AREAS, SKILL_LEVELS } from "../../lib/constants.js";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function DrillPickerPanel({
  sessionId,
  existingDrillIds = [],
  onClose,
}) {
  const [search, setSearch] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [showMine, setShowMine] = useState(false);
  const [page, setPage] = useState(1);
  const [addingIds, setAddingIds] = useState(new Set());

  const debouncedSearch = useDebounce(search, 300);

  const filters = {
    page,
    limit: 10,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(focusArea ? { focus_area: focusArea } : {}),
    ...(skillLevel ? { skill_level: skillLevel } : {}),
  };

  const publicQuery = useDrills(showMine ? null : filters);
  const myQuery = useMyDrills(showMine ? filters : null);
  const addDrill = useAddDrillToSession();

  const queryResult = showMine ? myQuery : publicQuery;
  const drills = queryResult.data?.items ?? [];
  const totalPages = queryResult.data?.pages ?? 1;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, focusArea, skillLevel, showMine]);

  async function handleAdd(drill) {
    setAddingIds((prev) => new Set(prev).add(drill.id));
    try {
      await addDrill.mutateAsync({ sessionId, data: { drill_id: drill.id } });
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(drill.id);
        return next;
      });
    }
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg tracking-wide"
          style={{
            fontFamily: '"Bebas Neue", cursive',
            color: "var(--color-text)",
          }}
        >
          Add Drills
        </h3>
        <button
          onClick={onClose}
          aria-label="Close drill picker"
          style={{ color: "var(--color-text-muted)" }}
          className="hover:text-danger transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Toggle mine/all */}
      <div
        className="flex rounded-lg overflow-hidden mb-4 border"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          className="flex-1 py-1.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: !showMine
              ? "var(--color-accent)"
              : "var(--color-surface-2)",
            color: !showMine ? "var(--color-bg)" : "var(--color-text-muted)",
          }}
          onClick={() => setShowMine(false)}
        >
          All Public
        </button>
        <button
          className="flex-1 py-1.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: showMine
              ? "var(--color-accent)"
              : "var(--color-surface-2)",
            color: showMine ? "var(--color-bg)" : "var(--color-text-muted)",
          }}
          onClick={() => setShowMine(true)}
        >
          My Drills
        </button>
      </div>

      {/* Search */}
      <div className="mb-3">
        <Input
          placeholder="Search drills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={focusArea}
          onChange={(e) => setFocusArea(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg text-xs"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <option value="">All Focus Areas</option>
          {FOCUS_AREAS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg text-xs"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <option value="">All Skill Levels</option>
          {SKILL_LEVELS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Drill list */}
      {queryResult.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg animate-pulse"
              style={{ backgroundColor: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      ) : drills.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No drills found
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {drills.map((drill) => {
            const alreadyAdded = existingDrillIds.includes(drill.id);
            const isAdding = addingIds.has(drill.id);
            const focusLabel =
              FOCUS_AREAS.find((f) => f.value === drill.focus_area)?.label ??
              drill.focus_area;

            return (
              <div
                key={drill.id}
                className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-sm truncate"
                    style={{ color: "var(--color-text)" }}
                  >
                    {drill.title}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {drill.focus_area && (
                      <Badge variant="focus">{focusLabel}</Badge>
                    )}
                    {drill.skill_level && (
                      <Badge variant="skill">{drill.skill_level}</Badge>
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
                <Button
                  variant={alreadyAdded ? "secondary" : "primary"}
                  size="sm"
                  disabled={alreadyAdded || isAdding}
                  loading={isAdding}
                  onClick={() => handleAdd(drill)}
                  aria-label={
                    alreadyAdded ? "Already in session" : `Add ${drill.title}`
                  }
                >
                  {alreadyAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      In Session
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
