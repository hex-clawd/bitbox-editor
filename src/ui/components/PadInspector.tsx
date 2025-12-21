import React, { useMemo, useState } from "react";
import type { Pad } from "../../core/domain/bitboxPreset";
import { buildBlackboxConfRows, buildBlackboxMainRows, type DisplayRow } from "../viewModels/blackboxParamView";

type Props = {
  pad: Pad;
};

type RawRow = { key: string; value: string };

function toRawRows(params: Record<string, string>): RawRow[] {
  return Object.entries(params)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

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

function sectionCard(title: string, right?: React.ReactNode, children?: React.ReactNode) {
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
        <h3 style={{ margin: 0 }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
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

export default function PadInspector({ pad }: Props) {
  const [filter, setFilter] = useState("");

  const mainRows = useMemo(() => buildBlackboxMainRows(pad.params ?? {}), [pad.params]);
  const confRows = useMemo(() => buildBlackboxConfRows(pad.params ?? {}), [pad.params]);

  const rawRows = useMemo(() => toRawRows(pad.params ?? {}), [pad.params]);

  const filteredRawRows = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return rawRows;
    return rawRows.filter((r) => r.key.toLowerCase().includes(f) || r.value.toLowerCase().includes(f));
  }, [rawRows, filter]);

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

      {/* Main Parameters (BB-style) */}
      {sectionCard(
        "Main Parameters",
        <div style={{ opacity: 0.75, fontSize: 12 }}>
          mode: <code>{pad.padMode}</code>
        </div>,
        renderRowsTable(mainRows)
      )}

      {/* Conf Parameters (BB-style) */}
      {sectionCard(
        "Conf Parameters",
        <div style={{ opacity: 0.75, fontSize: 12 }}>
          raw params: <code>{rawRows.length}</code>
        </div>,
        renderRowsTable(confRows)
      )}

      {/* Raw params (still available) */}
      {sectionCard(
        "All params (raw)",
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
        />,
        filteredRawRows.length === 0 ? (
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
        )
      )}

      {/* Slices */}
      {showSlices &&
        sectionCard(
          "Slices",
          <div style={{ opacity: 0.8, fontSize: 12 }}>
            count: <code>{pad.slices?.length ?? 0}</code>
          </div>,
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
        )}

      {/* Multisample mapping */}
      {showAssets &&
        sectionCard(
          "Multisample mapping",
          <div style={{ opacity: 0.8, fontSize: 12 }}>
            assets: <code>{pad.assets.length}</code>
          </div>,
          <div style={{ marginTop: 10, maxHeight: 260, overflow: "auto", borderRadius: 8, border: "1px solid rgba(255,255,255,0.10)" }}>
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
        )}
    </div>
  );
}
