import React, { useMemo } from "react";
import type { BitboxPreset, Pad } from "../../core/domain/bitboxPreset";

type Props = {
    preset: BitboxPreset;
    selectedPadKey: string | null;
    onSelectPad: (padKey: string) => void;
};

function padKeyFromRC(row: number, column: number): string {
    return `r${row}c${column}`;
}

function padKey(p: Pad): string {
    return padKeyFromRC(p.grid.row, p.grid.column);
}

function shortNameFromPath(p: string): string {
    const parts = p.split("\\").filter(Boolean);
    return parts[parts.length - 1] ?? p;
}

function cellTitle(p: Pad): string {
    const base = `R${p.grid.row} C${p.grid.column}`;
    if (!p.filename) return `${base} — (no filename)`;
    return `${base} — ${p.filename}`;
}

export default function PresetDetails({ preset, selectedPadKey, onSelectPad }: Props) {
    const padMap = useMemo(() => {
        const m = new Map<string, Pad>();
        for (const p of preset.pads) m.set(padKey(p), p);
        return m;
    }, [preset.pads]);

    const selectedPad: Pad | null = useMemo(() => {
        if (!selectedPadKey) return null;
        return padMap.get(selectedPadKey) ?? null;
    }, [padMap, selectedPadKey]);

    const samplesList = useMemo(() => {
        if (!selectedPad) return { primary: [] as string[], assets: [] as string[] };
        const assets = selectedPad.assets?.map((a) => a.filename) ?? [];
        const primary = selectedPad.filename ? [selectedPad.filename] : [];
        return { primary, assets };
    }, [selectedPad]);

    // Blackbox grid is 4x4. Your parser uses row/col from XML.
    // UI requirement: row 0 / col 0 should be bottom-left.
    // So we render rows visually from top (row=3) to bottom (row=0).
    const GRID_ROWS = 4;
    const GRID_COLS = 4;

    return (
        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16, alignItems: "start" }}>
            {/* Left: 4x4 grid */}
            <div>
                <h2 style={{ marginTop: 0 }}>Pads (4×4)</h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                        gap: 10,
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(0,0,0,0.10)",
                    }}
                >
                    {Array.from({ length: GRID_ROWS }).map((_, visualRowIndex) => {
                        // visualRowIndex 0 is top row; should map to row=3
                        const row = GRID_ROWS - 1 - visualRowIndex;

                        return Array.from({ length: GRID_COLS }).map((__, col) => {
                            const key = padKeyFromRC(row, col);
                            const p = padMap.get(key);
                            const isActive = key === selectedPadKey;
                            const isEmpty = !p;

                            const displayText = p?.filename ? shortNameFromPath(p.filename) : "";

                            return (
                                <button
                                    key={`${row}-${col}`}
                                    onClick={() => {
                                        if (!p) return;
                                        onSelectPad(key);
                                    }}
                                    disabled={!p}
                                    title={p ? cellTitle(p) : `R${row} C${col} — (empty)`}
                                    style={{
                                        height: 86,
                                        padding: 10,
                                        borderRadius: 10,
                                        border: isActive
                                            ? "2px solid rgba(255,255,255,0.55)"
                                            : "1px solid rgba(255,255,255,0.18)",
                                        background: isEmpty
                                            ? "rgba(255,255,255,0.03)"
                                            : isActive
                                                ? "rgba(255,255,255,0.12)"
                                                : "rgba(255,255,255,0.06)",
                                        color: "inherit",
                                        cursor: isEmpty ? "not-allowed" : "pointer",
                                        textAlign: "left",
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        fontFamily: "inherit",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 8,
                                            opacity: isEmpty ? 0.45 : 0.9,
                                            fontSize: 12,
                                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                        }}
                                    >
                                        <span>{`R${row}C${col}`}</span>
                                        <span style={{ opacity: 0.75 }}>
                      {p ? (p.sampleKind ?? "unknown") : ""}
                    </span>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontSize: 12,
                                            opacity: isEmpty ? 0.35 : 0.95,
                                            lineHeight: 1.2,
                                            wordBreak: "break-word",
                                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                        }}
                                    >
                                        {p ? (displayText || "(no filename)") : ""}
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginTop: 8,
                                            fontSize: 12,
                                            opacity: isEmpty ? 0.35 : 0.85,
                                        }}
                                    >
                                        <span>{p ? `assets: ${p.assets?.length ?? 0}` : ""}</span>
                                        <span>{p ? `slices: ${p.slices?.length ?? 0}` : ""}</span>
                                    </div>
                                </button>
                            );
                        });
                    })}
                </div>

                <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
                    Orientation: <code>row 0 / col 0</code> is bottom-left (Blackbox style).
                </div>
            </div>

            {/* Right: pad details */}
            <div>
                <h2 style={{ marginTop: 0 }}>Pad details</h2>

                {!selectedPad ? (
                    <p style={{ opacity: 0.8 }}>Click a pad in the grid.</p>
                ) : (
                    <>
                        {/* Summary */}
                        <div
                            style={{
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: 8,
                                padding: 12,
                                background: "rgba(0,0,0,0.18)",
                            }}
                        >
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
                                <div style={{ fontWeight: 700 }}>
                                    {padKey(selectedPad)} ({selectedPad.type})
                                </div>
                                <div style={{ opacity: 0.85 }}>
                                    kind: <code>{selectedPad.sampleKind ?? "unknown"}</code>
                                </div>
                                <div style={{ opacity: 0.85 }}>
                                    slices: <code>{selectedPad.slices?.length ?? 0}</code>
                                </div>
                                <div style={{ opacity: 0.85 }}>
                                    assets: <code>{selectedPad.assets?.length ?? 0}</code>
                                </div>
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <div style={{ opacity: 0.8, fontSize: 13 }}>Pad filename:</div>
                                <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                                    {selectedPad.filename ?? "(none)"}
                                </div>
                            </div>
                        </div>

                        {/* Samples */}
                        <h3 style={{ marginTop: 16 }}>Samples</h3>

                        <div
                            style={{
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: 8,
                                padding: 12,
                                background: "rgba(0,0,0,0.18)",
                            }}
                        >
                            <div style={{ opacity: 0.85, marginBottom: 6 }}>
                                Primary ref (pad filename): <code>{samplesList.primary.length}</code>
                            </div>
                            {samplesList.primary.length === 0 ? (
                                <div style={{ opacity: 0.8 }}>(none)</div>
                            ) : (
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                    {samplesList.primary.map((s, i) => (
                                        <li
                                            key={i}
                                            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
                                        >
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div style={{ opacity: 0.85, marginTop: 12, marginBottom: 6 }}>
                                Asset samples (multisample list): <code>{samplesList.assets.length}</code>
                            </div>

                            {samplesList.assets.length === 0 ? (
                                <div style={{ opacity: 0.8 }}>(none)</div>
                            ) : (
                                <div style={{ maxHeight: 320, overflow: "auto", borderRadius: 6 }}>
                                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                                        {samplesList.assets.map((s, i) => (
                                            <li
                                                key={i}
                                                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
                                            >
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Raw pad object (for dev) */}
                        <h3 style={{ marginTop: 16 }}>Raw pad data</h3>
                        <pre
                            style={{
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                padding: 12,
                                borderRadius: 8,
                                border: "1px solid rgba(255,255,255,0.15)",
                                background: "rgba(0,0,0,0.18)",
                                fontSize: 12,
                            }}
                        >
              {JSON.stringify(selectedPad, null, 2)}
            </pre>
                    </>
                )}
            </div>
        </div>
    );
}