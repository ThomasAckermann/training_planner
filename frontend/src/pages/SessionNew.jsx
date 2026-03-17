import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { X } from "lucide-react";
import { useCreateSession } from "../hooks/useSessions.js";
import { AGE_RANGES, FOCUS_AREAS, SKILL_LEVELS } from "../lib/constants.js";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";

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

export default function SessionNew() {
  const navigate = useNavigate();
  const createSession = useCreateSession();
  const [selectedFocusAreas, setSelectedFocusAreas] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { is_public: false },
  });

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
    const payload = {
      title: values.title,
      description: values.description || null,
      age_range: values.age_range || null,
      skill_level: values.skill_level || null,
      focus_areas: selectedFocusAreas,
      team_size: values.team_size ? Number(values.team_size) : null,
      is_public: values.is_public,
      tags,
    };

    const session = await createSession.mutateAsync(payload);
    navigate(`/sessions/${session.id}/edit`);
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
          Create New Session
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          Fill in the session details. After creating, you can add drills to
          your session.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <Card>
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Basic Information
          </h2>
          <div className="space-y-4">
            <Input
              label="Title *"
              placeholder="e.g. Tuesday Evening Training"
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
                rows={4}
                placeholder="What is the main focus of this training session?"
                {...register("description")}
              />
            </div>

            <Input
              label="Team Size"
              type="number"
              placeholder="12"
              error={errors.team_size?.message}
              {...register("team_size")}
            />
          </div>
        </Card>

        {/* Classification */}
        <Card>
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Classification
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                <option value="">Select level</option>
                {SKILL_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Focus areas multi-select */}
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
                    className="px-3 py-1 rounded-full text-sm border transition-all"
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

        {/* Tags */}
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
            placeholder="Type a tag and press Enter (e.g. transition)"
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

        {/* Publish toggle + Submit */}
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
              Publish publicly
            </span>
          </label>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/me")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting || createSession.isPending}
            >
              Create Session
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
