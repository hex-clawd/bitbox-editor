import React from "react";
import type { DisplayRow } from "../../viewModels/blackboxParamView";

type Props = {
    title: string;
    rows: DisplayRow[];
    rightControls?: React.ReactNode;
    emptyText?: string;
};

export default function ParamRowsSection({ title, rows, rightControls, emptyText }: Props) {
    return (
        <section>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 8,
                }}
            >
                <div style={{ fontWeight: 800 }}>{title}</div>
                {rightControls ?? null}
            </div>

            {rows.length === 0 ? (
                <div style={{ opacity: 0.75, fontSize: 12 }}>{emptyText ?? "No params."}</div>
            ) : (
                <div style={{ display: "grid", gap: 6 }}>
                    {rows.map((r) => (
                        <div
                            key={r.rawKey ?? r.label}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(140px, 220px) minmax(0, 1fr)",
                                gap: 10,
                                alignItems: "baseline",
                            }}
                        >
                            <div style={{ opacity: 0.85, fontSize: 12 }}>{r.label}</div>
                            <div
                                style={{
                                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                    fontSize: 12,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                                title={r.value}
                            >
                                {r.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
