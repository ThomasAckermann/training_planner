import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Check, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import { FOCUS_AREAS } from "../../lib/constants.js";
import {
  useReorderSessionDrills,
  useRemoveDrillFromSession,
  useUpdateDrillInSession,
} from "../../hooks/useSessions.js";

function SortableDrillRow({ drill, sessionId, isOwner, index }) {
  const navigate = useNavigate();
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationValue, setDurationValue] = useState(
    drill.duration_override ?? drill.duration_minutes ?? "",
  );

  const removeDrill = useRemoveDrillFromSession();
  const updateDrill = useUpdateDrillInSession();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: drill.drill_session_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const focusLabel =
    FOCUS_AREAS.find((f) => f.value === drill.focus_area)?.label ??
    drill.focus_area;
  const effectiveDuration = drill.duration_override ?? drill.duration_minutes;

  async function handleRemove(e) {
    e.stopPropagation();
    if (!confirm("Remove this drill from the session?")) return;
    await removeDrill.mutateAsync({
      sessionId,
      drillSessionId: drill.drill_session_id,
    });
  }

  async function handleSaveDuration() {
    const val = durationValue === "" ? null : Number(durationValue);
    await updateDrill.mutateAsync({
      sessionId,
      drillSessionId: drill.drill_session_id,
      data: { duration_override: val },
    });
    setEditingDuration(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
      className="flex items-start gap-3 p-3 rounded-xl border mb-2"
    >
      {/* Drag handle */}
      {isOwner && (
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing"
          style={{ color: "var(--color-text-muted)" }}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {/* Index */}
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold mt-0.5"
        style={{
          backgroundColor: "var(--color-surface-2)",
          color: "var(--color-text-muted)",
        }}
      >
        {index + 1}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <button
            className="font-semibold text-sm text-left hover:underline"
            style={{ color: "var(--color-text)" }}
            onClick={() => navigate(`/drills/${drill.id}`)}
          >
            {drill.title}
          </button>
          {drill.focus_area && <Badge variant="focus">{focusLabel}</Badge>}
        </div>

        {/* Thumbnail */}
        {drill.drawing_thumb_url && (
          <div
            className="mb-1.5 rounded overflow-hidden"
            style={{ border: "1px solid var(--color-border)", maxWidth: 240 }}
          >
            <img
              src={drill.drawing_thumb_url}
              alt="Tactical diagram"
              className="w-full block"
            />
          </div>
        )}

        {/* Duration */}
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {isOwner && editingDuration ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                className="w-16 px-1.5 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
                min={1}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveDuration();
                  if (e.key === "Escape") setEditingDuration(false);
                }}
              />
              <span>min</span>
              <button onClick={handleSaveDuration} aria-label="Save duration">
                <Check
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--color-accent)" }}
                />
              </button>
            </div>
          ) : (
            <button
              className={`flex items-center gap-1 ${
                isOwner ? "hover:underline cursor-pointer" : ""
              }`}
              onClick={() => isOwner && setEditingDuration(true)}
              aria-label={isOwner ? "Click to edit duration" : undefined}
            >
              {effectiveDuration != null ? (
                <>
                  {drill.duration_override != null && (
                    <Pencil
                      className="w-3 h-3"
                      style={{ color: "var(--color-accent)" }}
                    />
                  )}
                  {effectiveDuration} min
                </>
              ) : (
                <span style={{ color: "var(--color-text-muted)" }}>— min</span>
              )}
            </button>
          )}
        </div>

        {/* Coach notes */}
        {drill.coach_notes && (
          <p
            className="text-xs mt-1 italic"
            style={{ color: "var(--color-text-muted)" }}
          >
            {drill.coach_notes}
          </p>
        )}
      </div>

      {/* Remove button */}
      {isOwner && (
        <Button
          variant="danger"
          size="sm"
          onClick={handleRemove}
          loading={removeDrill.isPending}
          className="flex-shrink-0"
          aria-label="Remove drill from session"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

const PHASE_DISPLAY = {
  WARMUP: "Warm-up",
  MAIN: "Main Part",
  GAME: "Game",
  COOLDOWN: "Cool-down",
};

export default function SessionDrillList({
  drills = [],
  sessionId,
  isOwner = false,
}) {
  const navigate = useNavigate();
  const reorderDrills = useReorderSessionDrills();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = drills.findIndex((d) => d.drill_session_id === active.id);
    const newIndex = drills.findIndex((d) => d.drill_session_id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(drills, oldIndex, newIndex);
    reorderDrills.mutate({
      sessionId,
      drill_session_ids: reordered.map((d) => d.drill_session_id),
    });
  }

  if (drills.length === 0) {
    return (
      <div
        className="text-center py-10 rounded-xl border"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No drills in this session yet.
          {isOwner && " Add drills using the panel below."}
        </p>
      </div>
    );
  }

  if (!isOwner) {
    let lastPhaseLabel = null;
    return (
      <div>
        {drills.map((drill, index) => {
          const showHeader =
            drill.phase_label && drill.phase_label !== lastPhaseLabel;
          if (drill.phase_label) lastPhaseLabel = drill.phase_label;
          const phaseDisplay =
            PHASE_DISPLAY[drill.phase_label] ?? drill.phase_label;
          return (
            <div key={drill.drill_session_id}>
              {showHeader && (
                <div className="flex items-center gap-3 my-3">
                  <div
                    className="h-px flex-1"
                    style={{ backgroundColor: "var(--color-border)" }}
                  />
                  <span
                    className="text-xs font-mono font-bold uppercase tracking-widest px-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {phaseDisplay}
                  </span>
                  <div
                    className="h-px flex-1"
                    style={{ backgroundColor: "var(--color-border)" }}
                  />
                </div>
              )}
              <div
                className="p-4 rounded-xl border mb-2"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold mt-0.5"
                    style={{
                      backgroundColor: "var(--color-surface-2)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <button
                        className="font-semibold text-sm text-left hover:underline"
                        style={{ color: "var(--color-text)" }}
                        onClick={() => navigate(`/drills/${drill.id}`)}
                      >
                        {drill.title}
                      </button>
                      {drill.focus_area && (
                        <Badge variant="focus">
                          {FOCUS_AREAS.find((f) => f.value === drill.focus_area)
                            ?.label ?? drill.focus_area}
                        </Badge>
                      )}
                      {drill.skill_level && (
                        <Badge variant="skill">{drill.skill_level}</Badge>
                      )}
                      {drill.age_range && (
                        <Badge variant="age">{drill.age_range}</Badge>
                      )}
                    </div>
                    <div
                      className="text-xs mb-2"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {(drill.duration_override ?? drill.duration_minutes) !=
                      null
                        ? `${
                            drill.duration_override ?? drill.duration_minutes
                          } min`
                        : "— min"}
                      {drill.num_players_min != null && (
                        <span className="ml-3">
                          {drill.num_players_min}
                          {drill.num_players_max &&
                          drill.num_players_max !== drill.num_players_min
                            ? `–${drill.num_players_max}`
                            : ""}{" "}
                          players
                        </span>
                      )}
                    </div>
                    {drill.drawing_thumb_url && (
                      <div
                        className="mb-2 rounded overflow-hidden"
                        style={{
                          border: "1px solid var(--color-border)",
                          maxWidth: 320,
                        }}
                      >
                        <img
                          src={drill.drawing_thumb_url}
                          alt="Tactical diagram"
                          className="w-full block"
                        />
                      </div>
                    )}
                    {drill.description && (
                      <p
                        className="text-xs leading-relaxed mb-2"
                        style={{
                          color: "var(--color-text-muted)",
                          fontFamily: '"Lora", serif',
                        }}
                      >
                        {drill.description}
                      </p>
                    )}
                    {drill.coach_notes && (
                      <p
                        className="text-xs italic pl-3"
                        style={{
                          color: "var(--color-accent)",
                          borderLeft: "2px solid var(--color-accent)",
                        }}
                      >
                        {drill.coach_notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={drills.map((d) => d.drill_session_id)}
        strategy={verticalListSortingStrategy}
      >
        {drills.map((drill, index) => (
          <SortableDrillRow
            key={drill.drill_session_id}
            drill={drill}
            sessionId={sessionId}
            isOwner={isOwner}
            index={index}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
