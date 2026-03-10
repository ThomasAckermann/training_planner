import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useSession } from "../hooks/useSessions.js";
import { FOCUS_AREAS } from "../lib/constants.js";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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

export default function SessionCoach() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: session, isLoading, isError } = useSession(id);

  const [drillIdx, setDrillIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [running, setRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  const drills = session?.drills ?? [];
  const drill = drills[drillIdx] ?? null;
  const totalDrills = drills.length;

  // Reset timer when drill changes
  useEffect(() => {
    if (!drill) return;
    const dur = (drill.duration_override ?? drill.duration_minutes ?? 0) * 60;
    setSecondsLeft(dur > 0 ? dur : null);
    setRunning(false);
    clearInterval(intervalRef.current);
  }, [drillIdx, drill]);

  // Countdown
  useEffect(() => {
    if (!running || secondsLeft === null) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, secondsLeft]);

  function handleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function resetTimer() {
    if (!drill) return;
    const dur = (drill.duration_override ?? drill.duration_minutes ?? 0) * 60;
    setSecondsLeft(dur > 0 ? dur : null);
    setRunning(false);
    clearInterval(intervalRef.current);
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-accent)" }}
        />
      </div>
    );
  }

  if (isError || !session || totalDrills === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <p style={{ color: "var(--color-danger)" }}>
          Session not found or has no drills.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm underline"
          style={{ color: "var(--color-text-muted)" }}
        >
          Go back
        </button>
      </div>
    );
  }

  const focusLabel =
    FOCUS_AREAS.find((f) => f.value === drill?.focus_area)?.label ??
    drill?.focus_area;
  const focusColor = FOCUS_COLORS[drill?.focus_area] ?? "var(--color-accent)";
  const effectiveDuration = drill
    ? drill.duration_override ?? drill.duration_minutes ?? 0
    : 0;
  const totalSeconds = effectiveDuration * 60;
  const progressPct =
    totalSeconds > 0 && secondsLeft !== null
      ? ((totalSeconds - secondsLeft) / totalSeconds) * 100
      : 0;

  return (
    <div
      ref={containerRef}
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          onClick={() => navigate(`/sessions/${id}`)}
          className="flex items-center gap-1.5 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ChevronLeft className="w-4 h-4" />
          Exit
        </button>
        <span
          className="text-sm font-medium truncate max-w-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {session.title}
        </span>
        <button
          onClick={handleFullscreen}
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main drill area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto w-full">
        {/* Drill counter */}
        <div
          className="text-sm font-mono mb-4"
          style={{ color: "var(--color-text-muted)" }}
        >
          Drill {drillIdx + 1} / {totalDrills}
        </div>

        {/* Focus area badge */}
        {drill?.focus_area && (
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ backgroundColor: `${focusColor}22`, color: focusColor }}
          >
            {focusLabel}
          </div>
        )}

        {/* Drill title */}
        <h1
          className="text-center mb-4"
          style={{
            fontFamily: '"Bebas Neue", cursive',
            fontSize: "clamp(2rem, 8vw, 4rem)",
            color: "var(--color-text)",
            lineHeight: 1.1,
          }}
        >
          {drill?.title}
        </h1>

        {/* Tactical drawing thumbnail */}
        {drill?.drawing_thumb_url && (
          <div
            className="w-full max-w-sm rounded-xl overflow-hidden mb-6"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <img
              src={drill.drawing_thumb_url}
              alt="Tactical diagram"
              className="w-full"
            />
          </div>
        )}

        {/* Description */}
        {drill?.description && (
          <p
            className="text-center text-sm leading-relaxed mb-6 max-w-md"
            style={{
              color: "var(--color-text-muted)",
              fontFamily: '"Lora", serif',
            }}
          >
            {drill.description}
          </p>
        )}

        {/* Coach notes */}
        {drill?.coach_notes && (
          <div
            className="w-full max-w-md rounded-lg px-4 py-3 mb-6 text-sm"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              fontStyle: "italic",
            }}
          >
            <span
              className="font-semibold not-italic"
              style={{ color: "var(--color-text)" }}
            >
              Coach notes:{" "}
            </span>
            {drill.coach_notes}
          </div>
        )}

        {/* Timer */}
        {secondsLeft !== null && (
          <div className="flex flex-col items-center mb-6 w-full max-w-xs">
            {/* Progress ring area */}
            <div
              className="text-6xl font-mono mb-3 tabular-nums"
              style={{
                color:
                  secondsLeft === 0
                    ? "var(--color-danger)"
                    : "var(--color-text)",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {formatTime(secondsLeft)}
            </div>

            {/* Progress bar */}
            <div
              className="w-full rounded-full overflow-hidden mb-4"
              style={{
                backgroundColor: "var(--color-surface-2)",
                height: "6px",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor:
                    secondsLeft === 0 ? "var(--color-danger)" : focusColor,
                }}
              />
            </div>

            {/* Timer controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={resetTimer}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRunning((r) => !r)}
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: focusColor,
                  color: "#000",
                }}
              >
                {running ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div
        className="flex items-center justify-between px-4 py-4 border-t flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          onClick={() => setDrillIdx((i) => Math.max(0, i - 1))}
          disabled={drillIdx === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-30 transition-opacity"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1.5">
          {drills.map((_, i) => (
            <button
              key={i}
              onClick={() => setDrillIdx(i)}
              className="rounded-full transition-all"
              style={{
                width: i === drillIdx ? "16px" : "8px",
                height: "8px",
                backgroundColor:
                  i === drillIdx ? focusColor : "var(--color-surface-2)",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => setDrillIdx((i) => Math.min(totalDrills - 1, i + 1))}
          disabled={drillIdx === totalDrills - 1}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-30 transition-opacity"
          style={{
            backgroundColor: focusColor,
            color: "#000",
          }}
        >
          Next
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
