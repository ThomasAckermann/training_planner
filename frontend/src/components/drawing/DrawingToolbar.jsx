import { Undo2, Redo2, Trash2, Save } from "lucide-react";
import { useDrawingStore } from "../../store/drawingStore.js";

export default function DrawingToolbar({
  stageRef,
  onSave,
  isSaving,
  saveLabel,
}) {
  const {
    past,
    future,
    selectedId,
    undo,
    redo,
    removeIcon,
    removeArrow,
    getDrawingJson,
  } = useDrawingStore();

  function handleDelete() {
    if (!selectedId) return;
    removeIcon(selectedId);
    removeArrow(selectedId);
  }

  function handleSave() {
    if (!stageRef?.current) return;
    const thumbnailDataUrl = stageRef.current.toDataURL({
      mimeType: "image/png",
      pixelRatio: 2,
    });
    const drawingJson = getDrawingJson();
    onSave({ drawingJson, thumbnailDataUrl });
  }

  const btnBase = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    border: "1px solid var(--color-border)",
    cursor: "pointer",
    transition: "all 0.15s",
    backgroundColor: "var(--color-surface-2)",
    color: "var(--color-text)",
  };

  const btnDisabled = {
    opacity: 0.35,
    cursor: "not-allowed",
  };

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-xl"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <button
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        style={{ ...btnBase, ...(past.length === 0 ? btnDisabled : {}) }}
        disabled={past.length === 0}
        onClick={undo}
      >
        <Undo2 size={14} />
        Undo
      </button>

      <button
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
        style={{ ...btnBase, ...(future.length === 0 ? btnDisabled : {}) }}
        disabled={future.length === 0}
        onClick={redo}
      >
        <Redo2 size={14} />
        Redo
      </button>

      <div
        style={{
          width: 1,
          height: 20,
          backgroundColor: "var(--color-border)",
          margin: "0 2px",
        }}
      />

      <button
        title="Delete selected (Del)"
        aria-label="Delete selected"
        style={{
          ...btnBase,
          ...(!selectedId ? btnDisabled : {}),
          color: selectedId ? "var(--color-danger)" : undefined,
          borderColor: selectedId ? "var(--color-danger)" : undefined,
        }}
        disabled={!selectedId}
        onClick={handleDelete}
      >
        <Trash2 size={14} />
        Delete
      </button>

      <div style={{ flex: 1 }} />

      <button
        title="Save drawing"
        aria-label={isSaving ? "Saving drawing" : saveLabel || "Save Drawing"}
        style={{
          ...btnBase,
          backgroundColor: "var(--color-accent)",
          color: "#ffffff",
          borderColor: "var(--color-accent)",
          ...(isSaving ? btnDisabled : {}),
        }}
        disabled={isSaving}
        onClick={handleSave}
      >
        <Save size={14} />
        {isSaving ? "Saving…" : saveLabel || "Save Drawing"}
      </button>
    </div>
  );
}
