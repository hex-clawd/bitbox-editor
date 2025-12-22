import React, { useMemo } from "react";
import type { BitboxPreset, Pad } from "../../core/domain/bitboxPreset";
import PadInspector from "./PadInspector";

type Props = {
    preset: BitboxPreset;
    selectedPadKey: string | null;
    onSelectPad: (padKey: string) => void;
    onCreatePad: (row: number, column: number) => void;
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

function cellTitle(row: number, col: number, p?: Pad): string {
    const base = `R${row} C${col}`;
    if (!p) return `${base} — (empty)`;
    if (!p.filename) return `${base} — (no filename)`;
    return `${base} — ${p.filename}`;
}

function clampInt(n: number, min: number, max: number): number {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, Math.trunc(n)));
}

function midiInLabel(midiIn: number): string {
    const ch = clampInt(midiIn, 0, 16);
    return ch === 0 ? "None" : `Ch${ch}`;
}

function padNoteLabel(padNote: number): string {
    const nn = clampInt(padNote, 0, 127);
    return nn === 0 ? "0" : `${nn}`;
}

export default function PresetDetails({ preset, selectedPadKey, onSelectPad, onCreatePad }: Props) {
    const padMap = useMemo(() => {
        const m = new Map<string, Pad>();
        for (const p of preset.pads) m.set(padKey(p), p);
        return m;
    }, [preset.pads]);

    const GRID_ROWS = 4;
    const GRID_COLS = 4;

    const selectedRC = useMemo(() => {
        if (!selectedPadKey) return null;
        const m = selectedPadKey.match(/^r(\d+)c(\d+)$/);
        if (!m) return null;
        return { row: Number(m[1]), col: Number(m[2]) };
    }, [selectedPadKey]);

    const selectedPad: Pad | null = useMemo(() => {
        if (!selectedPadKey) return null;
        return padMap.get(selectedPadKey) ?? null;
    }, [padMap, selectedPadKey]);

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
                    {Array.from({ length: GRID_ROWS }).flatMap((_, visualRowIndex) => {
                        const row = GRID_ROWS - 1 - visualRowIndex; // row 3 top, row 0 bottom

                        return Array.from({ length: GRID_COLS }).map((__, col) => {
                            const key = padKeyFromRC(row, col);
                            const p = padMap.get(key);
                            const isActive = key === selectedPadKey;
                            const isEmpty = !p;

                            const displayText = p?.filename ? shortNameFromPath(p.filename) : "";
                            const modeText = p ? p.padMode : "empty";

                            const midiText = p ? midiInLabel(p.midiIn) : "";
                            const noteText = p ? padNoteLabel(p.padNote) : "";

                            return (
                                <button
                                    key={`${row}-${col}`}
                                    onClick={() => onSelectPad(key)}
                                    title={cellTitle(row, col, p)}
                                    style={{
                                        height: 86,
                                        padding: 10,
                                        borderRadius: 10,
                                        border: isActive
                                            ? "2px solid rgba(255,255,255,0.55)"
                                            : "1px solid rgba(255,255,255,0.18)",
                                        background: isEmpty
                                            ? isActive
                                                ? "rgba(255,255,255,0.08)"
                                                : "rgba(255,255,255,0.03)"
                                            : isActive
                                                ? "rgba(255,255,255,0.12)"
                                                : "rgba(255,255,255,0.06)",
                                        color: "inherit",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        fontFamily: "inherit",
                                        opacity: isEmpty ? 0.85 : 1,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 8,
                                            opacity: 0.9,
                                            fontSize: 12,
                                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                        }}
                                    >
                                        <span>{`R${row}C${col}`}</span>
                                        <span style={{ opacity: 0.75 }}>{modeText}</span>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontSize: 12,
                                            opacity: 0.95,
                                            lineHeight: 1.2,
                                            wordBreak: "break-word",
                                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                        }}
                                    >
                                        {p ? (displayText || "(no filename)") : "(empty)"}
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                                        <span>{p ? `assets: ${p.assets?.length ?? 0}` : ""}</span>
                                        <span>{p ? `slices: ${p.slices?.length ?? 0}` : ""}</span>
                                    </div>

                                    {/* Small MIDI footer (so you can see it without opening inspector) */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginTop: 6,
                                            fontSize: 11,
                                            opacity: 0.75,
                                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                        }}
                                    >
                                        <span>{p ? `midi: ${midiText}` : ""}</span>
                                        <span>{p ? `note: ${noteText}` : ""}</span>
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

            {/* Right: inspector */}
            <div>
                <h2 style={{ marginTop: 0 }}>Inspector</h2>

                {!selectedPadKey || !selectedRC ? (
                    <p style={{ opacity: 0.8 }}>Click a pad in the grid.</p>
                ) : !selectedPad ? (
                    <div
                        style={{
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 8,
                            padding: 12,
                            background: "rgba(0,0,0,0.18)",
                        }}
                    >
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>
                            Empty pad: <code>{selectedPadKey}</code>
                        </div>

                        <div style={{ opacity: 0.85, marginBottom: 12 }}>
                            This grid cell has no pad data in the preset yet.
                        </div>

                        <button onClick={() => onCreatePad(selectedRC.row, selectedRC.col)}>Create pad here</button>
                    </div>
                ) : (
                    <PadInspector pad={selectedPad} />
                )}
            </div>
        </div>
    );
}