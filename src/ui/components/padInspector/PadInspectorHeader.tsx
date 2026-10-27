import type { Pad } from "../../../core/domain/bitboxPreset";

type Props = {
    pad: Pad;
};

export default function PadInspectorHeader({ pad }: Props) {
    return (
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
                    R{pad.grid.row} C{pad.grid.column} ({pad.type})
                </div>
                <div style={{ opacity: 0.85 }}>
                    mode: <code>{pad.padMode}</code>
                </div>
                <div style={{ opacity: 0.85 }}>
                    slices: <code>{pad.slices?.length ?? 0}</code>
                </div>
                <div style={{ opacity: 0.85 }}>
                    assets: <code>{pad.assets?.length ?? 0}</code>
                </div>
            </div>

            <div style={{ marginTop: 8 }}>
                <div style={{ opacity: 0.8, fontSize: 13 }}>Filename:</div>
                <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                    {pad.filename && pad.filename.trim() ? pad.filename : "(none)"}
                </div>
            </div>
        </div>
    );
}
