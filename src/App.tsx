import "./App.css";
import { useEffect, useState } from "react";
import { usePresetBrowser } from "./ui/hooks/usePresetBrowser";
import PresetFileList from "./ui/components/PresetFileList";
import PresetDetails from "./ui/components/PresetDetails";
import type { BitboxPreset } from "./core/domain/bitboxPreset";
import { ensurePadAt } from "./core/domain/presetEdit";

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

    const [selectedPadKey, setSelectedPadKey] = useState<string | null>(null);

    // Editable working copy (in-memory only for now)
    const [editablePreset, setEditablePreset] = useState<BitboxPreset | null>(null);

    // When a new preset is parsed, reset editable copy + selection
    useEffect(() => {
        setSelectedPadKey(null);
        setEditablePreset(selectedPreset ? structuredClone(selectedPreset) : null);
    }, [selectedPreset]);

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
                            setSelectedPadKey(null);
                            setEditablePreset(null);
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

                            {/* Parsed model → Grid + Details */}
                            <h2 style={{ marginTop: 16 }}>Parsed pads</h2>

                            {!editablePreset ? (
                                <p style={{ opacity: 0.8 }}>No parsed preset.</p>
                            ) : (
                                <>
                                    {editablePreset.warnings.length > 0 && (
                                        <div style={{ marginBottom: 12, opacity: 0.9 }}>
                                            <strong>Warnings:</strong>
                                            <ul style={{ marginTop: 6 }}>
                                                {editablePreset.warnings.map((w, i) => (
                                                    <li key={i} style={{ opacity: 0.85 }}>
                                                        {w}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <PresetDetails
                                        preset={editablePreset}
                                        selectedPadKey={selectedPadKey}
                                        onSelectPad={setSelectedPadKey}
                                        onCreatePad={(row, column) => {
                                            setEditablePreset((prev) => (prev ? ensurePadAt(prev, row, column, { gridCols: 4 }) : prev));
                                            setSelectedPadKey(`r${row}c${column}`);
                                        }}
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