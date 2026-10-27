import type { BitboxPreset, Pad } from "./bitboxPreset";

/**
 * Pure function: ensures a pad exists at row/column.
 * If it already exists, returns the preset unchanged.
 * If missing, returns a new preset with an empty pad inserted.
 */
export function ensurePadAt(
  preset: BitboxPreset,
  row: number,
  column: number,
  opts?: { gridCols?: number; type?: string }
): BitboxPreset {
  const gridCols = opts?.gridCols ?? 4;
  const type = opts?.type ?? "sample";

  const exists = preset.pads.some((p) => p.grid.row === row && p.grid.column === column);
  if (exists) return preset;

  const newPad: Pad = {
    index: row * gridCols + column,
    grid: { row, column },
    type,
    padMode: "sample",
    filename: "",
    params: {},
    midiIn: 0,
    padNote: 0,
    slices: undefined,
    assets: [],
    meta: { createdByEditor: "1" },
  };

  return {
    ...preset,
    pads: [...preset.pads, newPad].sort((a, b) => (a.grid.row - b.grid.row) || (a.grid.column - b.grid.column)),
  };
}
