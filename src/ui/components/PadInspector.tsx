import React, { useMemo, useState } from "react";
import type { Pad } from "../../core/domain/bitboxPreset";

type Props = {
  pad: Pad;
};

type Row = { key: string; value: string };

function toRows(params: Record<string, string>): Row[] {
  return Object.entries(params)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function formatMaybeDb(v: string): string {
  // Blackbox often stores gaindb in thousandths of dB (e.g. -3000 = -3.0 dB)
  // This is a best-effort display only.
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  if (Math.abs(n) >= 1000 && Math.abs(n) % 1 === 0) {
    // show with 1 decimal place
    return `${(n / 1000).toFixed(1)} dB`;
  }
  return v;
}

function isLikelyDbKey(k: string): boolean {
  return k.toLowerCase().includes("gaindb") || k.toLowerCase().endsWith("db");
}

function renderValue(k: string, v: string): string {
  if (isLikelyDbKey(k)) return formatMaybeDb(v);
  return v;
}

const IMPORTANT_KEYS: Array<{ key: string; label?: string }> = [
  { key: "gaindb", label: "Gain" },
  { key: "pitch" },
  { key: "panpos", label: "Pan" },
  { key: "samtrigtype", label: "Trig" },
  { key: "loopmode" },
  { key: "midimode" },
  { key: "cellmode" },
  { key: "multisammode", label: "Multisample mode" },
  { key: "samstart" },
  { key: "samlen" },
  { key: "loopstart" },
  { key: "loopend" },
  { key: "quantsize" },
  { key: "synctype" },
  { key: "outputbus" },
  { key: "chokegrp" },
];

export default function PadInspector({ pad }: Props) {
  const [filter, setFilter] = useState("");

  const allRows = useMemo(() => toRows(pad.params ?? {}), [pad.params]);

  const importantRows = useMemo(() => {
    const map = new Map(allRows.map((r) => [r.key, r.value]));
    return IMPORTANT_KEYS
      .filter((k) => map.has(k.key))
      .map((k) => ({ key: k.key, label: k.label ?? k.key, value: map.get(k.key) ?? "" }));
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return allRows;

    return allRows.filter((r) => r.key.toLowerCase().includes(f) || r.value.toLowerCase().includes(f));
  }, [allRows, filter]);

  const showSlices = (pad.slices?.length ?? 0) > 0;
  const showAssets = (pad.assets?.length ?? 0) > 0;

  return (
    <div style={{ display: "grid", gap: 14 }}>
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
            R{pad.grid.row} C{pad.grid.column} ({pad.type})
          </div>
          <div style={{ opacity: 0.85 }}>
            kind: <code>{pad.sampleKind ?? "unknown"}</code>
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

      {/* Important params */}
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 8,
          padding: 12,
          background: "rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Key params</h3>
          <div style={{ opacity: 0.75, fontSize: 12 }}>
            total: <code>{allRows.length}</code>
          </div>
        </div>

        {importantRows.length === 0 ? (
          <div style={{ opacity: 0.8, marginTop: 8 }}>(no params parsed)</div>
        ) : (
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 6, columnGap: 12 }}>
            {importantRows.map((r) => (
              <React.Fragment key={r.key}>
                <div style={{ opacity: 0.8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                  {r.label}
                </div>
                <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                  {renderValue(r.key, r.value)}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* All params (filterable) */}
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 8,
          padding: 12,
          background: "rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <h3 style={{ margin: 0 }}>All params</h3>
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

        {filteredRows.length === 0 ? (
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
                {filteredRows.map((r) => (
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
                      {renderValue(r.key, r.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slices */}
      {showSlices && (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding: 12,
            background: "rgba(0,0,0,0.18)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Slices</h3>
          <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 8 }}>
            count: <code>{pad.slices?.length ?? 0}</code>
          </div>
          <div
            style={{
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
      )}

      {/* Multisample mapping */}
      {showAssets && (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding: 12,
            background: "rgba(0,0,0,0.18)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Multisample mapping</h3>
          <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 8 }}>
            assets: <code>{pad.assets.length}</code>
          </div>

          <div style={{ maxHeight: 260, overflow: "auto", borderRadius: 8, border: "1px solid rgba(255,255,255,0.10)" }}>
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
                {pad.assets.map((a, i) => {
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
                      <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{key}</td>
                      <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{vel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
