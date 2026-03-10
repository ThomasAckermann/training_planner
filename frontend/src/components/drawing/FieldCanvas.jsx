import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect, Line, Text, Arrow } from "react-konva";
import { useDrawingStore } from "../../store/drawingStore.js";
import DraggableIcon from "./DraggableIcon.jsx";

// ── Court layout constants ──────────────────────────────────────────────────
const STAGE_W = 760;
const STAGE_H = 460;
const COURT_X = 40;
const COURT_Y = 55;
const COURT_W = 680;
const COURT_H = 340;
const CENTER_X = COURT_X + COURT_W / 2;
const ATTACK_OFFSET = (3 / 18) * COURT_W; // 3 m on each side

const COURT_BG = "#1a0a0a";
const COURT_LINE = "#ffffff";
const NET_COLOR = "#cc1414";
const ATTACK_COLOR = "rgba(255,255,255,0.45)";

// Preset colors for the icon color-picker
const COLOR_SWATCHES = [
  "#cc1414",
  "#ffffff",
  "#FFD700",
  "#4488FF",
  "#44BB44",
  "#FF8800",
  "#ff69b4",
  "#888888",
];

// ── Court background (static, non-interactive) ─────────────────────────────
function CourtBackground() {
  const attackL = CENTER_X - ATTACK_OFFSET;
  const attackR = CENTER_X + ATTACK_OFFSET;

  const zoneLabels = [
    {
      label: "4",
      x: COURT_X + (attackL - COURT_X) / 2,
      y: COURT_Y + COURT_H / 4,
    },
    { label: "3", x: (attackL + CENTER_X) / 2, y: COURT_Y + COURT_H / 4 },
    {
      label: "2",
      x: CENTER_X + (attackR - CENTER_X) / 2,
      y: COURT_Y + COURT_H / 4,
    },
    {
      label: "1",
      x: attackR + (COURT_X + COURT_W - attackR) / 2,
      y: COURT_Y + COURT_H / 4,
    },
    {
      label: "5",
      x: COURT_X + (attackL - COURT_X) / 2,
      y: COURT_Y + (COURT_H * 3) / 4,
    },
    { label: "6", x: (attackL + CENTER_X) / 2, y: COURT_Y + (COURT_H * 3) / 4 },
  ];

  return (
    <>
      <Rect
        x={COURT_X}
        y={COURT_Y}
        width={COURT_W}
        height={COURT_H}
        fill={COURT_BG}
      />
      <Rect
        x={COURT_X}
        y={COURT_Y}
        width={COURT_W}
        height={COURT_H}
        stroke={COURT_LINE}
        strokeWidth={2}
        fill="transparent"
      />
      {/* Net */}
      <Line
        points={[CENTER_X, COURT_Y, CENTER_X, COURT_Y + COURT_H]}
        stroke={NET_COLOR}
        strokeWidth={2.5}
      />
      {/* Attack lines */}
      <Line
        points={[attackL, COURT_Y, attackL, COURT_Y + COURT_H]}
        stroke={ATTACK_COLOR}
        strokeWidth={1.5}
        dash={[6, 4]}
      />
      <Line
        points={[attackR, COURT_Y, attackR, COURT_Y + COURT_H]}
        stroke={ATTACK_COLOR}
        strokeWidth={1.5}
        dash={[6, 4]}
      />
      <Text
        x={CENTER_X - 14}
        y={COURT_Y - 20}
        text="NET"
        fontSize={10}
        letterSpacing={2}
        fill={NET_COLOR}
        listening={false}
      />
    </>
  );
}

// ── Main canvas component ───────────────────────────────────────────────────
export default function FieldCanvas({ stageRef, initialDrawing }) {
  const {
    icons,
    arrows,
    selectedId,
    setSelected,
    addIcon,
    addArrow,
    updateIcon,
    updateArrow,
    removeIcon,
    removeArrow,
    undo,
    redo,
    loadDrawing,
  } = useDrawingStore();

  // Arrow drawing
  const [arrowPreview, setArrowPreview] = useState(null);
  const isDrawingArrow = useRef(false);

  // Context / colour menu
  const [menu, setMenu] = useState(null);
  // menu shape: { x, y, targetId, targetType }  OR null

  // Text editor (floating DOM input)
  const [textEdit, setTextEdit] = useState(null);
  // textEdit shape: { iconId, stageX, stageY, currentText }

  // Load initial drawing once
  const loadedRef = useRef(false);
  useEffect(() => {
    if (initialDrawing && !loadedRef.current) {
      loadedRef.current = true;
      loadDrawing(initialDrawing);
    }
  }, [initialDrawing, loadDrawing]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        removeIcon(selectedId);
        removeArrow(selectedId);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo, selectedId, removeIcon, removeArrow]);

  // Dismiss menu on outside click
  useEffect(() => {
    if (!menu) return;
    const dismiss = () => setMenu(null);
    window.addEventListener("click", dismiss);
    return () => window.removeEventListener("click", dismiss);
  }, [menu]);

  // ── Drop from palette ──────────────────────────────────────────────────────
  function handleDrop(e) {
    e.preventDefault();
    const iconType = e.dataTransfer.getData("iconType");
    if (!iconType) return;
    const rect = e.currentTarget.getBoundingClientRect();
    addIcon({
      id: crypto.randomUUID(),
      type: iconType,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      color: null,
      text: iconType === "text" ? "Label" : undefined,
    });
  }

  // ── Arrow drawing (click-drag on empty court) ──────────────────────────────
  function handleStageMouseDown(e) {
    const isBackground =
      e.target === e.target.getStage() || e.target.name() === "court-bg";
    if (!isBackground) return;
    setSelected(null);
    setMenu(null);
    const pos = e.target.getStage().getPointerPosition();
    isDrawingArrow.current = true;
    setArrowPreview({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
  }

  function handleStageMouseMove(e) {
    if (!isDrawingArrow.current) return;
    const pos = e.target.getStage().getPointerPosition();
    setArrowPreview((p) => (p ? { ...p, x2: pos.x, y2: pos.y } : null));
  }

  function handleStageMouseUp() {
    if (!isDrawingArrow.current || !arrowPreview) return;
    isDrawingArrow.current = false;
    const { x1, y1, x2, y2 } = arrowPreview;
    if (Math.hypot(x2 - x1, y2 - y1) > 15) {
      addArrow({
        id: crypto.randomUUID(),
        points: [x1, y1, x2, y2],
        color: "#ffffff",
        dashed: false,
      });
    }
    setArrowPreview(null);
  }

  // ── Context menus ──────────────────────────────────────────────────────────
  function openIconMenu(e, iconId) {
    e.cancelBubble = true;
    const pos = e.target.getStage().getPointerPosition();
    setMenu({ x: pos.x, y: pos.y, targetId: iconId, targetType: "icon" });
  }

  function openArrowMenu(e, arrowId) {
    e.evt.preventDefault();
    const pos = e.target.getStage().getPointerPosition();
    setMenu({ x: pos.x, y: pos.y, targetId: arrowId, targetType: "arrow" });
  }

  function handleIconContextMenu(e, iconId) {
    // Check for text-edit signal from DraggableIcon
    if (e?.isTextEdit) {
      const icon = icons.find((i) => i.id === iconId);
      if (!icon) return;
      setTextEdit({
        iconId,
        stageX: icon.x,
        stageY: icon.y,
        currentText: icon.text || "Label",
      });
      return;
    }
    openIconMenu(e, iconId);
  }

  function deleteMenuTarget() {
    if (!menu) return;
    if (menu.targetType === "icon") removeIcon(menu.targetId);
    else removeArrow(menu.targetId);
    setMenu(null);
  }

  function changeIconColor(color) {
    if (!menu) return;
    updateIcon(menu.targetId, { color });
    setMenu(null);
  }

  function toggleArrowDash() {
    if (!menu) return;
    const arrow = arrows.find((a) => a.id === menu.targetId);
    if (arrow) updateArrow(menu.targetId, { dashed: !arrow.dashed });
    setMenu(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Text editor overlay */}
      {textEdit && (
        <div
          style={{
            position: "absolute",
            left: textEdit.stageX,
            top: textEdit.stageY,
            zIndex: 200,
          }}
        >
          <input
            autoFocus
            defaultValue={textEdit.currentText}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateIcon(textEdit.iconId, { text: e.target.value });
                setTextEdit(null);
              }
              if (e.key === "Escape") setTextEdit(null);
            }}
            onBlur={(e) => {
              updateIcon(textEdit.iconId, { text: e.target.value });
              setTextEdit(null);
            }}
            style={{
              background: "#1a1a1a",
              border: "1.5px solid #cc1414",
              color: "#fff",
              padding: "3px 8px",
              fontSize: 14,
              borderRadius: 4,
              outline: "none",
              minWidth: 90,
            }}
          />
        </div>
      )}

      {/* Konva stage */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ cursor: "crosshair" }}
      >
        <Stage
          ref={stageRef}
          width={STAGE_W}
          height={STAGE_H}
          style={{
            backgroundColor: "#111111",
            borderRadius: 8,
            display: "block",
          }}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onClick={(e) => {
            if (e.target === e.target.getStage()) {
              setSelected(null);
              setMenu(null);
            }
          }}
        >
          {/* Static court background */}
          <Layer name="court-background" listening={false}>
            <CourtBackground />
          </Layer>

          {/* Arrows */}
          <Layer name="arrows">
            {arrows.map((arrow) => (
              <Arrow
                key={arrow.id}
                points={arrow.points}
                stroke={arrow.color || "#ffffff"}
                strokeWidth={2.5}
                fill={arrow.color || "#ffffff"}
                pointerLength={10}
                pointerWidth={8}
                dash={arrow.dashed ? [8, 5] : undefined}
                opacity={selectedId === arrow.id ? 1 : 0.85}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelected(arrow.id);
                }}
                onContextMenu={(e) => openArrowMenu(e, arrow.id)}
                shadowColor={selectedId === arrow.id ? "#cc1414" : undefined}
                shadowBlur={selectedId === arrow.id ? 8 : 0}
              />
            ))}

            {/* Live arrow preview */}
            {arrowPreview && (
              <Arrow
                points={[
                  arrowPreview.x1,
                  arrowPreview.y1,
                  arrowPreview.x2,
                  arrowPreview.y2,
                ]}
                stroke="rgba(204,20,20,0.7)"
                strokeWidth={2}
                fill="rgba(204,20,20,0.7)"
                pointerLength={10}
                pointerWidth={8}
                listening={false}
              />
            )}
          </Layer>

          {/* Icons */}
          <Layer name="icons">
            {icons.map((icon) => (
              <DraggableIcon
                key={icon.id}
                icon={icon}
                isSelected={selectedId === icon.id}
                onSelect={() => setSelected(icon.id)}
                onChange={(updates) => updateIcon(icon.id, updates)}
                onContextMenu={(e) => handleIconContextMenu(e, icon.id)}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Context / color-picker menu */}
      {menu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            left: menu.x,
            top: menu.y,
            backgroundColor: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 8,
            overflow: "hidden",
            zIndex: 100,
            minWidth: 140,
            boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
          }}
        >
          {/* Color swatches — icons only */}
          {menu.targetType === "icon" && (
            <div
              style={{
                padding: "8px 10px 4px",
                borderBottom: "1px solid #333",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#888",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Color
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => changeIconColor(c)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: c,
                      border: "2px solid rgba(255,255,255,0.2)",
                      cursor: "pointer",
                    }}
                    title={c}
                  />
                ))}
                <input
                  type="color"
                  style={{
                    width: 22,
                    height: 22,
                    padding: 0,
                    border: "none",
                    borderRadius: "50%",
                    cursor: "pointer",
                    background: "none",
                  }}
                  title="Custom color"
                  onChange={(e) => changeIconColor(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Arrow-specific: toggle dashed */}
          {menu.targetType === "arrow" && (
            <button style={menuBtnStyle} onClick={toggleArrowDash}>
              Toggle dashed line
            </button>
          )}

          {/* Text icon: edit text */}
          {menu.targetType === "icon" &&
            icons.find((i) => i.id === menu.targetId)?.type === "text" && (
              <button
                style={menuBtnStyle}
                onClick={() => {
                  const icon = icons.find((i) => i.id === menu.targetId);
                  setTextEdit({
                    iconId: icon.id,
                    stageX: icon.x,
                    stageY: icon.y,
                    currentText: icon.text || "Label",
                  });
                  setMenu(null);
                }}
              >
                Edit text
              </button>
            )}

          <button
            style={{ ...menuBtnStyle, color: "#ff3333" }}
            onClick={deleteMenuTarget}
          >
            Delete
          </button>
        </div>
      )}

      {/* Usage hint */}
      <div
        style={{
          position: "absolute",
          bottom: 6,
          right: 10,
          fontSize: 10,
          color: "rgba(255,255,255,0.22)",
          pointerEvents: "none",
        }}
      >
        Drag icons from palette · Click &amp; drag court to draw arrows ·
        Right-click to edit/delete
      </div>
    </div>
  );
}

const menuBtnStyle = {
  display: "block",
  width: "100%",
  padding: "7px 12px",
  textAlign: "left",
  fontSize: 12,
  color: "#f0f0f0",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};
