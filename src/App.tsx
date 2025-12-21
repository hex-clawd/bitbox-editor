import "./App.css";
import { usePresetBrowser } from "./ui/hooks/usePresetBrowser";

export default function App() {
  const {
    folderPath,
    presetFiles,
    error,
    isBusy,
    selectedFile,
    selectedText,
    selectedPreset,
    chooseFolder,
    openPresetFile,
  } = usePresetBrowser();

  return (
      <div className="container" style={{ maxWidth: 1100 }}>
        <h1>Bitbox Editor (dev)</h1>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={chooseFolder} disabled={isBusy}>
            {isBusy ? "Working..." : "Choose folder"}
          </button>

          <div style={{ opacity: 0.8, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis" }}>
            {folderPath ? folderPath : "No folder selected"}
          </div>
        </div>

        {error && (
            <p style={{ color: "crimson", marginTop: 12 }}>
              Error: <code>{error}</code>
            </p>
        )}

        <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "360px 1fr",
              gap: 16,
              alignItems: "start",
            }}
        >
          {/* Left: file list */}
          <div>
            <h2 style={{ marginTop: 0 }}>Preset files (.xml)</h2>

            {presetFiles.length === 0 ? (
                <p style={{ opacity: 0.8 }}>
                  {folderPath ? "No .xml files found in this folder." : "Pick a folder to list files."}
                </p>
            ) : (
                <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                >
                  {presetFiles.map((f) => {
                    const isActive = selectedFile?.path === f.path;
                    return (
                        <button
                            key={f.path}
                            onClick={() => openPresetFile(f)}
                            disabled={isBusy}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 12px",
                              border: "none",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                              cursor: "pointer",
                              background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                              color: "inherit",
                              fontFamily: "inherit",
                            }}
                            title={f.path}
                        >
                          <code>{f.name}</code>
                        </button>
                    );
                  })}
                </div>
            )}
          </div>

          {/* Right: file contents + parsed model */}
          <div>
            <h2 style={{ marginTop: 0 }}>Contents</h2>

            {!selectedFile ? (
                <p style={{ opacity: 0.8 }}>Select a preset file on the left.</p>
            ) : (
                <>
                  <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 8 }}>
                    <strong>File:</strong> <code>{selectedFile.name}</code>
                  </div>

                  <textarea
                      readOnly
                      value={selectedText}
                      style={{
                        width: "100%",
                        minHeight: 320,
                        resize: "vertical",
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: 13,
                        lineHeight: 1.35,
                        padding: 12,
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(0,0,0,0.25)",
                        color: "inherit",
                      }}
                  />

                  <h3 style={{ marginTop: 16 }}>Parsed (typed model)</h3>
                  {!selectedPreset ? (
                      <p style={{ opacity: 0.8 }}>No parsed model.</p>
                  ) : (
                      <>
                          {selectedPreset.warnings.length > 0 && (
                              <div style={{marginBottom: 8, opacity: 0.9}}>
                                  <strong>Warnings:</strong>
                                  <ul style={{marginTop: 6}}>
                                      {selectedPreset.warnings.map((w, i) => (
                                          <li key={i} style={{opacity: 0.85}}>{w}</li>
                                      ))}
                                  </ul>
                              </div>
                          )}

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
  {JSON.stringify(
      {
          name: selectedPreset.name,
          pads: selectedPreset.pads
              .slice()
              .sort((a, b) => {
                  const ar = a.grid?.row ?? 0;
                  const br = b.grid?.row ?? 0;
                  if (ar !== br) return ar - br;
                  const ac = a.grid?.column ?? 0;
                  const bc = b.grid?.column ?? 0;
                  return ac - bc;
              })
              .map((p) => ({
                  row: p.grid?.row,
                  column: p.grid?.column,
                  filename: p.filename ?? "",
              })),
          warnings: selectedPreset.warnings,
      },
      null,
      2
  )}
</pre>

                      </>
                  )}
                </>
            )}
          </div>
        </div>
      </div>
  );
}