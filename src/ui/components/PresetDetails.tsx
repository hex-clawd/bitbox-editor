import React, { useMemo } from "react";
import type { BitboxPreset, Pad } from "../../core/domain/bitboxPreset";

type Props = {
    preset: BitboxPreset;
    selectedPadKey: string | null;
    onSelectPad: (padKey: string) => void;
};

function padKey(p: Pad): string {
    // row/column is the real ID
    return `r${p.grid.row}c${p.grid.column}`;
}

function padLabel(p: Pad): string {
    const row = p.grid.row;
    const col = p.grid.column;
    const filename = p.filename ?? "";
    const short = filename ? filename.split("\\").pop() ?? filename : "";
    return `R${row} C${col} — ${short || "(no filename)"}`;
}

export default function PresetDetails({ preset, selectedPadKey, onSelectPad }: Props) {
    const padsSorted = useMemo(() => {
        return preset.pads
            .slice()
            .sort((a, b) => (a.grid.row - b.grid.row) || (a.grid.column - b.grid.column));
    }, [preset.pads]);

    const selectedPad: Pad | null = useMemo(() => {
        if (!selectedPadKey) return null;
        return padsSorted.find((p) => padKey(p) === selectedPadKey) ?? null;
    }, [padsSorted, selectedPadKey]);

    const samplesList = useMemo(() => {
        if (!selectedPad) return [];
        // For multisample pads, assets contain all the actual WAVs
        // For slice/single pads, assets may be empty and filename is the WAV.
        const assets = selectedPad.assets?.map((a) => a.filename) ?? [];
        const primary = selectedPad.filename ? [selectedPad.filename] : [];
        return { primary, assets };
    }, [selectedPad]);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, alignItems: "start" }}>
            {/* Left: pad list */}
            <div>
                <h2 style={{ marginTop: 0 }}>Pads</h2>

                <div
                    style={{
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 8,
                        overflow: "hidden",
                    }}
                >
                    {padsSorted.map((p) => {
                        const key = padKey(p);
                        const active = key === selectedPadKey;

                        return (
                            <button
                                key={key}
                                onClick={() => onSelectPad(key)}
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "10px 12px",
                                    border: "none",
                                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                                    cursor: "pointer",
                                    background: active ? "rgba(255,255,255,0.10)" : "transparent",
                                    color: "inherit",
                                    fontFamily: "inherit",
                                }}
                                title={p.filename ?? ""}
                            >
                                <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                                    {padLabel(p)}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right: pad details */}
            <div>
                <h2 style={{ marginTop: 0 }}>Pad details</h2>

                {!selectedPad ? (
                    <p style={{ opacity: 0.8 }}>Select a pad on the left.</p>
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
                                        <li key={i} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
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
                                <div style={{ maxHeight: 260, overflow: "auto", borderRadius: 6 }}>
                                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                                        {samplesList.assets.map((s, i) => (
                                            <li key={i} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
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