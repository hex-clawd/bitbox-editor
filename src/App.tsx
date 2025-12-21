import "./App.css";
import { useState } from "react";
import { usePresetBrowser } from "./ui/hooks/usePresetBrowser";
import PresetFileList from "./ui/components/PresetFileList";
import PresetDetails from "./ui/components/PresetDetails";

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

    // UI-only state: which pad is selected in the details view
    const [selectedPadKey, setSelectedPadKey] = useState<string | null>(null);

    return (
        <div className="container" style={{ maxWidth: 1200 }}>
            <h1>Bitbox / Blackbox Preset Editor (dev)</h1>

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
                {/* Left: preset file list */}
                <div>
                    <h2 style={{ marginTop: 0 }}>Preset files (.xml)</h2>
                    <PresetFileList
                        files={presetFiles}
                        selectedPath={selectedFile?.path ?? null}
                        isBusy={isBusy}
                        onOpenFile={async (f) => {
                            setSelectedPadKey(null); // reset pad selection when opening a new preset
                            await openPresetFile(f);
                        }}
                    />
                </div>

                {/* Right: raw xml + parsed details */}
                <div>
                    <h2 style={{ marginTop: 0 }}>Selected preset</h2>

                    {!selectedFile ? (
                        <p style={{ opacity: 0.8 }}>Select a preset file on the left.</p>
                    ) : (
                        <>
                            <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 8 }}>
                                <strong>File:</strong> <code>{selectedFile.name}</code>
                            </div>

                            {/* Raw XML */}
                            <textarea
                                readOnly
                                value={selectedText}
                                style={{
                                    width: "100%",
                                    minHeight: 240,
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

                            {/* Parsed model → Pad list + details */}
                            <h2 style={{ marginTop: 16 }}>Parsed pads</h2>

                            {!selectedPreset ? (
                                <p style={{ opacity: 0.8 }}>No parsed preset.</p>
                            ) : (
                                <>
                                    {selectedPreset.warnings.length > 0 && (
                                        <div style={{ marginBottom: 12, opacity: 0.9 }}>
                                            <strong>Warnings:</strong>
                                            <ul style={{ marginTop: 6 }}>
                                                {selectedPreset.warnings.map((w, i) => (
                                                    <li key={i} style={{ opacity: 0.85 }}>
                                                        {w}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <PresetDetails
                                        preset={selectedPreset}
                                        selectedPadKey={selectedPadKey}
                                        onSelectPad={setSelectedPadKey}
                                    />
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}