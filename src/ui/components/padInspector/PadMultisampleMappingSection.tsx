import type { Pad } from "../../../core/domain/bitboxPreset";

type Props = {
    pad: Pad;
};

export default function PadMultisampleMappingSection({ pad }: Props) {
    const showAssets = (pad.assets?.length ?? 0) > 0;
    if (!showAssets) return null;

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
                <h3 style={{ margin: 0 }}>Multisample mapping</h3>
                <div style={{ opacity: 0.8, fontSize: 12 }}>
                    assets: <code>{pad.assets?.length ?? 0}</code>
                </div>
            </div>

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
                            <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>Sample</th>
                            <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>Root</th>
                            <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>Key</th>
                            <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>Vel</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(pad.assets ?? []).map((a, i) => {
                            const sample = a.filename.split("\\").pop() ?? a.filename;
                            const key = `${a.keyrange?.bottom ?? ""}-${a.keyrange?.top ?? ""}`;
                            const vel = `${a.velrange?.bottom ?? ""}-${a.velrange?.top ?? ""}`;

                            return (
                                <tr key={`${a.filename}-${i}`} style={{ verticalAlign: "top" }}>
                                    <td
                                        style={{
                                            padding: "6px 10px",
                                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                        }}
                                        title={a.filename}
                                    >
                                        {sample}
                                    </td>
                                    <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        {a.rootnote ?? ""}
                                    </td>
                                    <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        {key}
                                    </td>
                                    <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        {vel}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
