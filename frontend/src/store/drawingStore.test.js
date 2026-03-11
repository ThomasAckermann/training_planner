import { beforeEach, describe, expect, it } from "vitest";
import { useDrawingStore } from "./drawingStore.js";

describe("drawingStore", () => {
  beforeEach(() => {
    useDrawingStore.getState().reset();
  });

  it("starts with empty icons and arrows", () => {
    const { icons, arrows } = useDrawingStore.getState();
    expect(icons).toHaveLength(0);
    expect(arrows).toHaveLength(0);
  });

  it("addIcon appends an icon", () => {
    useDrawingStore
      .getState()
      .addIcon({ id: "1", type: "setter", x: 10, y: 20 });
    expect(useDrawingStore.getState().icons).toHaveLength(1);
    expect(useDrawingStore.getState().icons[0]).toMatchObject({
      id: "1",
      type: "setter",
    });
  });

  it("removeIcon removes the icon and clears selectedId", () => {
    useDrawingStore
      .getState()
      .addIcon({ id: "1", type: "setter", x: 10, y: 20 });
    useDrawingStore.getState().setSelected("1");
    useDrawingStore.getState().removeIcon("1");
    const state = useDrawingStore.getState();
    expect(state.icons).toHaveLength(0);
    expect(state.selectedId).toBeNull();
  });

  it("undo reverts addIcon", () => {
    useDrawingStore
      .getState()
      .addIcon({ id: "1", type: "setter", x: 10, y: 20 });
    useDrawingStore.getState().undo();
    expect(useDrawingStore.getState().icons).toHaveLength(0);
  });

  it("redo re-applies after undo", () => {
    useDrawingStore
      .getState()
      .addIcon({ id: "1", type: "setter", x: 10, y: 20 });
    useDrawingStore.getState().undo();
    useDrawingStore.getState().redo();
    expect(useDrawingStore.getState().icons).toHaveLength(1);
  });

  it("undo does nothing when history is empty", () => {
    useDrawingStore.getState().undo();
    expect(useDrawingStore.getState().icons).toHaveLength(0);
  });

  it("setSelectedPaletteIcon updates selectedPaletteIcon", () => {
    useDrawingStore.getState().setSelectedPaletteIcon("libero");
    expect(useDrawingStore.getState().selectedPaletteIcon).toBe("libero");
  });

  it("reset clears all state including palette selection", () => {
    useDrawingStore
      .getState()
      .addIcon({ id: "1", type: "setter", x: 10, y: 20 });
    useDrawingStore.getState().setSelectedPaletteIcon("libero");
    useDrawingStore.getState().reset();
    const state = useDrawingStore.getState();
    expect(state.icons).toHaveLength(0);
    expect(state.arrows).toHaveLength(0);
    expect(state.past).toHaveLength(0);
    expect(state.selectedPaletteIcon).toBeNull();
    expect(state.selectedId).toBeNull();
  });

  it("getDrawingJson serialises icons and arrows", () => {
    useDrawingStore
      .getState()
      .addIcon({ id: "1", type: "setter", x: 10, y: 20 });
    const json = useDrawingStore.getState().getDrawingJson();
    const parsed = JSON.parse(json);
    expect(parsed.icons).toHaveLength(1);
    expect(parsed.arrows).toHaveLength(0);
  });

  it("loadDrawing restores state and clears history", () => {
    useDrawingStore
      .getState()
      .loadDrawing({ icons: [{ id: "2", type: "libero" }], arrows: [] });
    const state = useDrawingStore.getState();
    expect(state.icons).toHaveLength(1);
    expect(state.past).toHaveLength(0);
  });
});
