import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import {
  useDrill,
  useUpdateDrill,
  useSaveDrawing,
} from "../hooks/useDrills.js";
import {
  AGE_RANGES,
  EQUIPMENT_OPTIONS,
  FOCUS_AREAS,
  SKILL_LEVELS,
} from "../lib/constants.js";
import { getEmbedUrl } from "../lib/video.js";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import { useDrawingStore } from "../store/drawingStore.js";
import ErrorBoundary from "../components/ui/ErrorBoundary.jsx";

const FieldCanvas = lazy(() => import("../components/drawing/FieldCanvas.jsx"));
const IconPalette = lazy(() => import("../components/drawing/IconPalette.jsx"));
const DrawingToolbar = lazy(
  () => import("../components/drawing/DrawingToolbar.jsx"),
);

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  duration_minutes: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal("")),
  num_players_min: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal("")),
  num_players_max: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal("")),
  age_range: z.string().optional(),
  skill_level: z.string().optional(),
  focus_area: z.string().optional(),
  video_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  is_public: z.boolean().default(false),
});

const labelClass = "block text-sm font-medium mb-1.5 font-ui";
const selectClass =
  "w-full bg-surface2 border border-border-color text-sm text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";
const textareaClass =
  "w-full bg-surface2 border border-border-color text-sm text-text-primary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none";

export default function DrillEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: drill, isLoading } = useDrill(id);
  const updateDrill = useUpdateDrill();
  const saveDrawing = useSaveDrawing();
  const stageRef = useRef(null);

  const [activeTab, setActiveTab] = useState("details");
  const [drawingMounted, setDrawingMounted] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [skillTags, setSkillTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [formReady, setFormReady] = useState(false);

  const {
    reset,
    handleSubmit,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const videoPreviewUrl = getEmbedUrl(watch("video_url"));

  useEffect(() => {
    if (activeTab === "drawing") setDrawingMounted(true);
  }, [activeTab]);

  useEffect(() => {
    if (drill && !formReady) {
      reset({
        title: drill.title ?? "",
        description: drill.description ?? "",
        duration_minutes: drill.duration_minutes ?? "",
        num_players_min: drill.num_players_min ?? "",
        num_players_max: drill.num_players_max ?? "",
        age_range: drill.age_range ?? "",
        skill_level: drill.skill_level ?? "",
        focus_area: drill.focus_area ?? "",
        video_url: drill.video_url ?? "",
        is_public: drill.is_public ?? false,
      });
      setEquipment(drill.equipment ?? []);
      setSkillTags(drill.skill_tags ?? []);
      setFormReady(true);
    }
  }, [drill, formReady, reset]);

  function addEquipment(item) {
    if (item && !equipment.includes(item))
      setEquipment((prev) => [...prev, item]);
  }
  function removeEquipment(item) {
    setEquipment((prev) => prev.filter((e) => e !== item));
  }
  function addTag(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
      if (tag && !skillTags.includes(tag))
        setSkillTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  }
  function removeTag(tag) {
    setSkillTags((prev) => prev.filter((t) => t !== tag));
  }

  async function onSubmit(values) {
    const payload = {
      title: values.title,
      description: values.description || null,
      duration_minutes: values.duration_minutes
        ? Number(values.duration_minutes)
        : null,
      num_players_min: values.num_players_min
        ? Number(values.num_players_min)
        : null,
      num_players_max: values.num_players_max
        ? Number(values.num_players_max)
        : null,
      age_range: values.age_range || null,
      skill_level: values.skill_level || null,
      focus_area: values.focus_area || null,
      video_url: values.video_url || null,
      is_public: values.is_public,
      equipment,
      skill_tags: skillTags,
    };
    await updateDrill.mutateAsync({ id, data: payload });
    navigate(`/drills/${id}`);
  }

  async function handleSaveDrawing({ drawingJson, thumbnailDataUrl }) {
    await saveDrawing.mutateAsync({
      drillId: id,
      drawingJson,
      thumbnailDataUrl,
    });
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4 animate-pulse">
        <div
          className="h-8 w-48 rounded"
          style={{ backgroundColor: "var(--color-surface)" }}
        />
        <div
          className="h-64 rounded-xl"
          style={{ backgroundColor: "var(--color-surface)" }}
        />
      </div>
    );
  }

  if (!drill) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p style={{ color: "var(--color-danger)" }} className="mb-4">
          Drill not found
        </p>
        <Button variant="secondary" onClick={() => navigate("/me")}>
          Back to My Drills
        </Button>
      </div>
    );
  }

  const tabs = [
    { key: "details", label: "Details" },
    { key: "drawing", label: "Drawing" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1
          className="text-4xl mb-2 tracking-wide"
          style={{
            fontFamily: '"Bebas Neue", cursive',
            color: "var(--color-text)",
          }}
        >
          Edit Drill
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>{drill.title}</p>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl border"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
          width: "fit-content",
        }}
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className="px-5 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor:
                activeTab === key ? "var(--color-surface-2)" : "transparent",
              color:
                activeTab === key
                  ? "var(--color-text)"
                  : "var(--color-text-muted)",
              border:
                activeTab === key
                  ? "1px solid var(--color-border)"
                  : "1px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Details tab ── */}
      {activeTab === "details" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Basic Information
            </h2>
            <div className="space-y-4">
              <Input
                label="Title *"
                placeholder="e.g. 6-2 Serve Receive Pattern"
                error={errors.title?.message}
                {...register("title")}
              />
              <div>
                <label
                  className={labelClass}
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Description
                </label>
                <textarea
                  className={textareaClass}
                  rows={5}
                  placeholder="Describe the drill, setup, and coaching points..."
                  {...register("description")}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Duration (min)"
                  type="number"
                  placeholder="15"
                  error={errors.duration_minutes?.message}
                  {...register("duration_minutes")}
                />
                <Input
                  label="Min Players"
                  type="number"
                  placeholder="6"
                  error={errors.num_players_min?.message}
                  {...register("num_players_min")}
                />
                <Input
                  label="Max Players"
                  type="number"
                  placeholder="12"
                  error={errors.num_players_max?.message}
                  {...register("num_players_max")}
                />
              </div>
            </div>
          </Card>

          <Card>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Classification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  className={labelClass}
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Age Range
                </label>
                <select className={selectClass} {...register("age_range")}>
                  <option value="">Select age range</option>
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
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Skill Level
                </label>
                <select className={selectClass} {...register("skill_level")}>
                  <option value="">Select level</option>
                  {SKILL_LEVELS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={labelClass}
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Focus Area
                </label>
                <select className={selectClass} {...register("focus_area")}>
                  <option value="">Select focus</option>
                  {FOCUS_AREAS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Equipment
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {EQUIPMENT_OPTIONS.map((item) => {
                const selected = equipment.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      selected ? removeEquipment(item) : addEquipment(item)
                    }
                    className="px-3 py-1 rounded-full text-sm border transition-all"
                    style={{
                      backgroundColor: selected
                        ? "#cc141422"
                        : "var(--color-surface2)",
                      borderColor: selected
                        ? "var(--color-accent)"
                        : "var(--color-border)",
                      color: selected
                        ? "var(--color-accent)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {equipment.length > 0 && (
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Selected: {equipment.join(", ")}
              </p>
            )}
          </Card>

          <Card>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Skill Tags
            </h2>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {skillTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono"
                  style={{
                    backgroundColor: "#cc141422",
                    color: "#cc1414",
                    border: "1px solid #cc141444",
                  }}
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              className={textareaClass.replace("resize-none", "")}
              placeholder="Type a tag and press Enter (e.g. jump-serve)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              style={{ height: "auto" }}
            />
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Press Enter or comma to add a tag · spaces become hyphens (e.g.
              &ldquo;back row&rdquo; → &ldquo;back-row&rdquo;)
            </p>
          </Card>

          <Card>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Video (optional)
            </h2>
            <Input
              label="YouTube or Vimeo URL"
              placeholder="https://www.youtube.com/watch?v=..."
              error={errors.video_url?.message}
              {...register("video_url")}
            />
            {videoPreviewUrl && (
              <div className="mt-3 aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={videoPreviewUrl}
                  title="Video preview"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </Card>

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
                style={{ color: "var(--color-text-primary)" }}
              >
                Publish publicly
              </span>
            </label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(`/drills/${id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting || updateDrill.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ── Drawing tab ── kept mounted once visited so stageRef stays valid */}
      {drawingMounted && (
        <div
          className="space-y-4"
          style={{ display: activeTab === "drawing" ? "" : "none" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Draw a tactical diagram. Right-click icons or arrows to change color
            / delete. Double-click text labels to edit them.
          </p>
          <ErrorBoundary
            title="Drawing tool failed to load"
            hint="Try running: docker compose up --build"
          >
            <Suspense
              fallback={
                <div
                  className="h-64 rounded-xl animate-pulse"
                  style={{ backgroundColor: "var(--color-surface)" }}
                />
              }
            >
              <DrawingToolbar
                stageRef={stageRef}
                onSave={handleSaveDrawing}
                isSaving={saveDrawing.isPending}
              />
              {/* Mobile: palette above canvas. Desktop: palette beside canvas */}
              <div className="flex flex-col md:flex-row gap-3 mt-3">
                <div className="md:hidden">
                  <IconPalette isMobile={true} />
                </div>
                <div className="hidden md:block">
                  <IconPalette isMobile={false} />
                </div>
                <div className="flex-1 min-w-0">
                  <FieldCanvas
                    stageRef={stageRef}
                    initialDrawing={drill.drawing_json}
                  />
                </div>
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}
