import React, { useMemo } from "react";
import type { Pad } from "../../../core/domain/bitboxPreset";
import { buildBlackboxMainRows, type DisplayRow } from "../../viewModels/blackboxParamView";

type Props = {
    pad: Pad;
};

function renderRowsTable(rows: DisplayRow[]) {
    if (rows.length === 0) {
        return <div style={{ opacity: 0.8, marginTop: 8 }}>(no matching params parsed)</div>;
    }

    return (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 6, columnGap: 12 }}>
            {rows.map((r) => (
                <React.Fragment key={r.label}>
                    <div style={{ opacity: 0.85, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                        {r.label}
                    </div>
                    <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                        {r.value}
                        {r.rawKey ? (
                            <span style={{ opacity: 0.55, marginLeft: 10 }}>
                                <code>{r.rawKey}</code>
                                {r.rawValue != null ? <span>={r.rawValue}</span> : null}
                            </span>
                        ) : null}
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}

export default function PadMainParamsSection({ pad }: Props) {
    const rows = useMemo(() => buildBlackboxMainRows(pad.params ?? {}), [pad.params]);

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
                <h3 style={{ margin: 0 }}>Main Parameters</h3>
                <div style={{ opacity: 0.75, fontSize: 12 }}>
                    mode: <code>{pad.padMode}</code>
                </div>
            </div>

            {renderRowsTable(rows)}
        </div>
    );
}
