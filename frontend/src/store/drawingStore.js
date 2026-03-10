import { create } from "zustand";

const MAX_HISTORY = 50;

function clonePresent(icons, arrows) {
  return {
    icons: icons.map((i) => ({ ...i })),
    arrows: arrows.map((a) => ({ ...a })),
  };
}

export const useDrawingStore = create((set, get) => ({
  icons: [],
  arrows: [],
  past: [],
  future: [],
  selectedId: null,

  _saveHistory() {
    const { icons, arrows, past } = get();
    set({
      past: [...past.slice(-(MAX_HISTORY - 1)), clonePresent(icons, arrows)],
      future: [],
    });
  },

  addIcon(icon) {
    get()._saveHistory();
    set((s) => ({ icons: [...s.icons, icon] }));
  },

  updateIcon(id, updates) {
    get()._saveHistory();
    set((s) => ({
      icons: s.icons.map((icon) =>
        icon.id === id ? { ...icon, ...updates } : icon,
      ),
    }));
  },

  removeIcon(id) {
    get()._saveHistory();
    set((s) => ({
      icons: s.icons.filter((icon) => icon.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
  },

  addArrow(arrow) {
    get()._saveHistory();
    set((s) => ({ arrows: [...s.arrows, arrow] }));
  },

  updateArrow(id, updates) {
    get()._saveHistory();
    set((s) => ({
      arrows: s.arrows.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  },

  removeArrow(id) {
    get()._saveHistory();
    set((s) => ({
      arrows: s.arrows.filter((a) => a.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
  },

  setSelected(id) {
    set({ selectedId: id });
  },

  undo() {
    const { past, icons, arrows, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      icons: previous.icons,
      arrows: previous.arrows,
      future: [clonePresent(icons, arrows), ...future],
      selectedId: null,
    });
  },

  redo() {
    const { past, icons, arrows, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      past: [...past, clonePresent(icons, arrows)],
      icons: next.icons,
      arrows: next.arrows,
      future: future.slice(1),
      selectedId: null,
    });
  },

  loadDrawing(drawingJson) {
    if (!drawingJson) return;
    try {
      const data =
        typeof drawingJson === "string" ? JSON.parse(drawingJson) : drawingJson;
      set({
        icons: data.icons || [],
        arrows: data.arrows || [],
        past: [],
        future: [],
        selectedId: null,
      });
    } catch {
      // ignore malformed JSON
    }
  },

  reset() {
    set({ icons: [], arrows: [], past: [], future: [], selectedId: null });
  },

  getDrawingJson() {
    const { icons, arrows } = get();
    return JSON.stringify({ icons, arrows });
  },
}));
