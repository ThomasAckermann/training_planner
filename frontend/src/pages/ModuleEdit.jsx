import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus } from "lucide-react";
import { useModule, useUpdateModule } from "../hooks/useModules.js";
import { useDrills, useMyDrills } from "../hooks/useDrills.js";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import { FOCUS_AREAS } from "../lib/constants.js";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  phase_type: z.enum(["WARMUP", "MAIN", "GAME", "COOLDOWN"]),
  description: z.string().optional(),
  is_public: z.boolean().default(false),
});

const PHASE_OPTIONS = [
  { value: "WARMUP", label: "Warm-up" },
  { value: "MAIN", label: "Main Part" },
  { value: "GAME", label: "Game" },
  { value: "COOLDOWN", label: "Cool-down" },
];

const labelClass = "block text-sm font-medium mb-1.5";
const selectClass =
  "w-full border text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-colors";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function ModuleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: module, isLoading } = useModule(id);
  const updateModule = useUpdateModule(id);
  const [selectedDrills, setSelectedDrills] = useState([]);
  const [formInitialized, setFormInitialized] = useState(false);
  const [search, setSearch] = useState("");
  const [showMine, setShowMine] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (module && !formInitialized) {
      reset({
        title: module.title,
        phase_type: module.phase_type,
        description: module.description ?? "",
        is_public: module.is_public,
      });
      setSelectedDrills(
        module.drills.map((md) => ({
          drill_id: md.drill_id,
          title: md.drill_title ?? md.drill_id,
          focus_area: md.drill_focus_area,
          duration_minutes: md.drill_duration_minutes,
          order_index: md.order_index,
          duration_override: md.duration_override,
          coach_notes: md.coach_notes,
        })),
      );
      setFormInitialized(true);
    }
  }, [module, formInitialized, reset]);

  const filters = {
    limit: 10,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };
  const publicQuery = useDrills(showMine ? {} : filters);
  const myQuery = useMyDrills(showMine ? filters : {});
  const queryResult = showMine ? myQuery : publicQuery;
  const availableDrills = queryResult.data?.items ?? [];

  function addDrill(drill) {
    if (selectedDrills.find((d) => d.drill_id === drill.id)) return;
    setSelectedDrills((prev) => [
      ...prev,
      {
        drill_id: drill.id,
        title: drill.title,
        focus_area: drill.focus_area,
        duration_minutes: drill.duration_minutes,
        order_index: prev.length,
        duration_override: null,
        coach_notes: null,
      },
    ]);
  }

  function removeDrill(drillId) {
    setSelectedDrills((prev) =>
      prev
        .filter((d) => d.drill_id !== drillId)
        .map((d, i) => ({ ...d, order_index: i })),
    );
  }

  async function onSubmit(values) {
    await updateModule.mutateAsync({
      title: values.title,
      phase_type: values.phase_type,
      description: values.description || null,
      is_public: values.is_public,
      drills: selectedDrills.map((d, i) => ({
        drill_id: d.drill_id,
        order_index: i,
        duration_override: d.duration_override,
        coach_notes: d.coach_notes,
      })),
    });
    navigate("/modules");
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div
          className="h-8 w-40 rounded"
          style={{ backgroundColor: "var(--color-surface)" }}
        />
        <div
          className="h-40 rounded-xl"
          style={{ backgroundColor: "var(--color-surface)" }}
        />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p style={{ color: "var(--color-danger)" }}>Module not found.</p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => navigate("/modules")}
        >
          Back to Modules
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1
          className="text-4xl mb-2 tracking-wide"
          style={{
            fontFamily: '"Bebas Neue", cursive',
            color: "var(--color-text)",
          }}
        >
          Edit Module
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          Update your training module.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Module Details
          </h2>
          <div className="space-y-4">
            <Input
              label="Title *"
              error={errors.title?.message}
              {...register("title")}
            />
            <div>
              <label
                className={labelClass}
                style={{ color: "var(--color-text)" }}
              >
                Phase Type *
              </label>
              <select
                className={selectClass}
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
                {...register("phase_type")}
              >
                {PHASE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className={labelClass}
                style={{ color: "var(--color-text)" }}
              >
                Description
              </label>
              <textarea
                className="w-full border text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-colors resize-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
                rows={3}
                {...register("description")}
              />
            </div>
          </div>
        </Card>

        {/* Drills */}
        <Card>
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Drills ({selectedDrills.length})
          </h2>
          {selectedDrills.length > 0 && (
            <div className="space-y-2 mb-4">
              {selectedDrills.map((d, index) => {
                const focusLabel =
                  FOCUS_AREAS.find((f) => f.value === d.focus_area)?.label ??
                  d.focus_area;
                return (
                  <div
                    key={d.drill_id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      backgroundColor: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span
                        className="font-medium text-sm"
                        style={{ color: "var(--color-text)" }}
                      >
                        {d.title}
                      </span>
                      <div className="flex gap-1.5 mt-0.5">
                        {d.focus_area && (
                          <Badge variant="focus">{focusLabel}</Badge>
                        )}
                        {d.duration_minutes && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {d.duration_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDrill(d.drill_id)}
                      className="flex-shrink-0 p-1 rounded hover:opacity-70"
                      style={{ color: "var(--color-danger)" }}
                      aria-label={`Remove ${d.title}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Drill Picker */}
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <Input
                  placeholder="Search drills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setShowMine(false)}
                  className="px-3 py-1.5 rounded text-xs font-medium border transition-colors"
                  style={{
                    backgroundColor: !showMine
                      ? "var(--color-accent)"
                      : "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: !showMine ? "#0f1117" : "var(--color-text-muted)",
                  }}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setShowMine(true)}
                  className="px-3 py-1.5 rounded text-xs font-medium border transition-colors"
                  style={{
                    backgroundColor: showMine
                      ? "var(--color-accent)"
                      : "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: showMine ? "#0f1117" : "var(--color-text-muted)",
                  }}
                >
                  Mine
                </button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {availableDrills.length === 0 ? (
                <p
                  className="text-xs py-4 text-center"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No drills found
                </p>
              ) : (
                availableDrills.map((drill) => {
                  const already = selectedDrills.some(
                    (d) => d.drill_id === drill.id,
                  );
                  const focusLabel =
                    FOCUS_AREAS.find((f) => f.value === drill.focus_area)
                      ?.label ?? drill.focus_area;
                  return (
                    <div
                      key={drill.id}
                      className="flex items-center gap-2 p-2 rounded cursor-pointer"
                      style={{
                        backgroundColor: already
                          ? "#4a9eff11"
                          : "var(--color-surface)",
                        opacity: already ? 0.7 : 1,
                      }}
                      onClick={() => !already && addDrill(drill)}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: "var(--color-text)" }}
                        >
                          {drill.title}
                        </p>
                        <div className="flex gap-1.5">
                          {drill.focus_area && (
                            <Badge variant="focus">{focusLabel}</Badge>
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
                      <button
                        type="button"
                        disabled={already}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!already) addDrill(drill);
                        }}
                        aria-label={`Add ${drill.title}`}
                      >
                        <Plus
                          className="w-4 h-4"
                          style={{
                            color: already
                              ? "var(--color-text-muted)"
                              : "var(--color-accent)",
                          }}
                        />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                {...register("is_public")}
              />
              <div className="w-11 h-6 rounded-full transition-colors peer-checked:bg-accent bg-surface2 border border-border-color" />
              <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-text-muted transition-transform peer-checked:translate-x-5 peer-checked:bg-bg" />
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Share publicly
            </span>
          </label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/modules")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting || updateModule.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
