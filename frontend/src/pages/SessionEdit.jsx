import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, PlusCircle, Clock, Layers, ArrowLeft, Package } from "lucide-react";
import { useSession, useUpdateSession } from "../hooks/useSessions.js";
import {
  useMyModules,
  useExpandModuleIntoSession,
} from "../hooks/useModules.js";
import useAuthStore from "../store/authStore.js";
import { AGE_RANGES, FOCUS_AREAS, SKILL_LEVELS } from "../lib/constants.js";
import SessionDrillList from "../components/session/SessionDrillList.jsx";
import DrillPickerPanel from "../components/session/DrillPickerPanel.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";

const PHASE_LABELS = {
  WARMUP: "Warm-up",
  MAIN: "Main Part",
  GAME: "Game",
  COOLDOWN: "Cool-down",
};

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  age_range: z.string().optional(),
  skill_level: z.string().optional(),
  team_size: z.coerce.number().int().positive().optional().or(z.literal("")),
  is_public: z.boolean().default(false),
});

const labelClass = "block text-sm font-medium mb-1.5";
const selectClass =
  "w-full border text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-colors";
const textareaClass =
  "w-full border text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-colors resize-none";

export default function SessionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const { data: session, isLoading, isError } = useSession(id);
  const updateSession = useUpdateSession();

  const [selectedFocusAreas, setSelectedFocusAreas] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [showDrillPicker, setShowDrillPicker] = useState(false);
  const [showModulePicker, setShowModulePicker] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  const { data: myModules } = useMyModules();
  const expandModule = useExpandModuleIntoSession(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (session && !formInitialized) {
      reset({
        title: session.title,
        description: session.description ?? "",
        age_range: session.age_range ?? "",
        skill_level: session.skill_level ?? "",
        team_size: session.team_size ?? "",
        is_public: session.is_public,
      });
      setSelectedFocusAreas(session.focus_areas ?? []);
      setTags(session.tags ?? []);
      setFormInitialized(true);
    }
  }, [session, formInitialized, reset]);

  function toggleFocusArea(value) {
    setSelectedFocusAreas((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function addTag(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
      if (tag && !tags.includes(tag)) {
        setTags((prev) => [...prev, tag]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function onSubmit(values) {
    await updateSession.mutateAsync({
      id,
      data: {
        title: values.title,
        description: values.description || null,
        age_range: values.age_range || null,
        skill_level: values.skill_level || null,
        focus_areas: selectedFocusAreas,
        team_size: values.team_size ? Number(values.team_size) : null,
        is_public: values.is_public,
        tags,
      },
    });
  }

  const isOwner = currentUser?.id === session?.user_id;
  const existingDrillIds = (session?.drills ?? []).map((d) => d.id);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div
            className="h-8 w-48 rounded"
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
      <div className="max-w-7xl mx-auto px-4 py-10 text-center">
        <p style={{ color: "var(--color-danger)" }}>
          Session not found or access denied.
        </p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => navigate("/me")}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center">
        <p style={{ color: "var(--color-danger)" }}>
          You don't have permission to edit this session.
        </p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => navigate(`/sessions/${id}`)}
        >
          View Session
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <button
        className="flex items-center gap-1 text-sm mb-6 hover:underline"
        style={{ color: "var(--color-text-muted)" }}
        onClick={() => navigate(`/sessions/${id}`)}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to session
      </button>

      {/* Summary bar */}
      <div
        className="flex flex-wrap items-center gap-6 p-4 rounded-xl border mb-8"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <h1
          className="text-3xl tracking-wide flex-1"
          style={{
            fontFamily: '"Bebas Neue", cursive',
            color: "var(--color-text)",
          }}
        >
          Edit: {session.title}
        </h1>
        <div
          className="flex items-center gap-4 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="flex items-center gap-1">
            <Layers className="w-4 h-4" />
            {session.drills?.length ?? 0} drills
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {session.total_duration_minutes} min total
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Metadata form */}
        <div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--color-text)" }}
              >
                Session Details
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
                    Description
                  </label>
                  <textarea
                    className={textareaClass}
                    style={{
                      backgroundColor: "var(--color-surface-2)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)",
                    }}
                    rows={3}
                    {...register("description")}
                  />
                </div>
                <Input
                  label="Team Size"
                  type="number"
                  {...register("team_size")}
                />
              </div>
            </Card>

            <Card>
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--color-text)" }}
              >
                Classification
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    className={labelClass}
                    style={{ color: "var(--color-text)" }}
                  >
                    Age Range
                  </label>
                  <select
                    className={selectClass}
                    style={{
                      backgroundColor: "var(--color-surface-2)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)",
                    }}
                    {...register("age_range")}
                  >
                    <option value="">Any</option>
                    {AGE_RANGES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={labelClass}
                    style={{ color: "var(--color-text)" }}
                  >
                    Skill Level
                  </label>
                  <select
                    className={selectClass}
                    style={{
                      backgroundColor: "var(--color-surface-2)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)",
                    }}
                    {...register("skill_level")}
                  >
                    <option value="">Any</option>
                    {SKILL_LEVELS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={labelClass}
                  style={{ color: "var(--color-text)" }}
                >
                  Focus Areas
                </label>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_AREAS.map((f) => {
                    const selected = selectedFocusAreas.includes(f.value);
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => toggleFocusArea(f.value)}
                        className="px-2.5 py-1 rounded-full text-xs border transition-all"
                        style={{
                          backgroundColor: selected
                            ? "#cc141422"
                            : "var(--color-surface-2)",
                          borderColor: selected
                            ? "var(--color-accent)"
                            : "var(--color-border)",
                          color: selected
                            ? "var(--color-accent)"
                            : "var(--color-text-muted)",
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card>
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--color-text)" }}
              >
                Tags
              </h2>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono"
                    style={{
                      backgroundColor: "#4a9eff22",
                      color: "#4a9eff",
                      border: "1px solid #4a9eff44",
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className={textareaClass.replace("resize-none", "")}
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  height: "auto",
                }}
                placeholder="Press Enter to add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Press Enter or comma to add a tag · spaces become hyphens (e.g.
                &ldquo;back row&rdquo; → &ldquo;back-row&rdquo;)
              </p>
            </Card>

            <div className="flex items-center justify-between">
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
                  Publish publicly
                </span>
              </label>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting || updateSession.isPending}
                disabled={
                  !isDirty &&
                  JSON.stringify(selectedFocusAreas) ===
                    JSON.stringify(session.focus_areas ?? []) &&
                  JSON.stringify(tags) === JSON.stringify(session.tags ?? [])
                }
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT: Drill management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Drills ({session.drills?.length ?? 0})
            </h2>
            <div className="flex gap-2">
              {!showDrillPicker && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowDrillPicker(true)}
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Drills
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowModulePicker((v) => !v)}
              >
                <Package className="w-4 h-4" />
                Add Module
              </Button>
            </div>
          </div>

          <SessionDrillList
            drills={session.drills ?? []}
            sessionId={id}
            isOwner={isOwner}
          />

          {showModulePicker && (
            <div
              className="rounded-xl border p-4 mt-4"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="font-semibold text-sm"
                  style={{ color: "var(--color-text)" }}
                >
                  Add a Training Module
                </h3>
                <button
                  onClick={() => setShowModulePicker(false)}
                  style={{ color: "var(--color-text-muted)" }}
                  aria-label="Close module picker"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {(myModules ?? []).length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No modules yet.{" "}
                  <a
                    href="/modules/new"
                    className="underline"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Create one
                  </a>
                </p>
              ) : (
                <div className="space-y-2">
                  {(myModules ?? []).map((module) => (
                    <div
                      key={module.id}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{
                        backgroundColor: "var(--color-surface-2)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-sm"
                          style={{ color: "var(--color-text)" }}
                        >
                          {module.title}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {PHASE_LABELS[module.phase_type] ?? module.phase_type}{" "}
                          · {module.drills.length} drill
                          {module.drills.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={expandModule.isPending}
                        onClick={async () => {
                          await expandModule.mutateAsync(module.id);
                          setShowModulePicker(false);
                        }}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showDrillPicker && (
            <DrillPickerPanel
              sessionId={id}
              existingDrillIds={existingDrillIds}
              onClose={() => setShowDrillPicker(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
