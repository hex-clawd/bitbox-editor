import React from "react";
import type { Pad } from "../../../core/domain/bitboxPreset";

type Props = {
    pad: Pad;
};

export default function PadSlicesSection({ pad }: Props) {
    const showSlices = (pad.slices?.length ?? 0) > 0;
    if (!showSlices) return null;

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
                <h3 style={{ margin: 0 }}>Slices</h3>
                <div style={{ opacity: 0.8, fontSize: 12 }}>
                    count: <code>{pad.slices?.length ?? 0}</code>
                </div>
            </div>

            <div
                style={{
                    marginTop: 10,
                    maxHeight: 160,
                    overflow: "auto",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.10)",
                    padding: 10,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: 12,
                    lineHeight: 1.35,
                }}
            >
                {(pad.slices ?? []).join(", ")}
            </div>
        </div>
    );
}
