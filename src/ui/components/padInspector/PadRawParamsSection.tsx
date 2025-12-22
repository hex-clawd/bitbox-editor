import React, { useMemo, useState } from "react";
import type { Pad } from "../../../core/domain/bitboxPreset";

type Props = {
    pad: Pad;
};

type RawRow = { key: string; value: string };

function toRawRows(params: Record<string, string>): RawRow[] {
    return Object.entries(params)
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => a.key.localeCompare(b.key));
}

function isLikelyDbKey(k: string): boolean {
    return k.toLowerCase().includes("gaindb") || k.toLowerCase().endsWith("db");
}

function formatMaybeDb(v: string): string {
    const n = Number(v);
    if (!Number.isFinite(n)) return v;
    if (Math.abs(n) >= 1000 && Math.abs(n) % 1 === 0) {
        return `${(n / 1000).toFixed(1)} dB`;
    }
    return v;
}

function renderRawValue(k: string, v: string): string {
    if (isLikelyDbKey(k)) return formatMaybeDb(v);
    return v;
}

export default function PadRawParamsSection({ pad }: Props) {
    const [filter, setFilter] = useState("");

    const rawRows = useMemo(() => toRawRows(pad.params ?? {}), [pad.params]);

    const filteredRawRows = useMemo(() => {
        const f = filter.trim().toLowerCase();
        if (!f) return rawRows;
        return rawRows.filter((r) => r.key.toLowerCase().includes(f) || r.value.toLowerCase().includes(f));
    }, [rawRows, filter]);

    return (
        <div
            style={{
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: 12,
                background: "rgba(0,0,0,0.18)",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <h3 style={{ margin: 0 }}>All params (raw)</h3>
                <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="filter (key or value)"
                    style={{
                        width: 220,
                        padding: "6px 8px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(0,0,0,0.20)",
                        color: "inherit",
                        fontFamily: "inherit",
                        fontSize: 13,
                    }}
                />
            </div>

            {filteredRawRows.length === 0 ? (
                <div style={{ opacity: 0.8, marginTop: 8 }}>(no matching params)</div>
            ) : (
                <div
                    style={{
                        marginTop: 10,
                        maxHeight: 260,
                        overflow: "auto",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.10)",
                    }}
                >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                            <tr style={{ textAlign: "left", opacity: 0.85 }}>
                                <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>Key</th>
                                <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRawRows.map((r) => (
                                <tr key={r.key} style={{ verticalAlign: "top" }}>
                                    <td
                                        style={{
                                            padding: "6px 10px",
                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                            width: 220,
                                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                            opacity: 0.85,
                                        }}
                                    >
                                        {r.key}
                                    </td>
                                    <td
                                        style={{
                                            padding: "6px 10px",
                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                        }}
                                    >
                                        {renderRawValue(r.key, r.value)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
