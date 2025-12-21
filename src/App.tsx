import "./App.css";
import { useEffect, useMemo, useState } from "react";

import { usePresetBrowser } from "./ui/hooks/usePresetBrowser";
import PresetDetails from "./ui/components/PresetDetails";
import TopToolbar from "./ui/components/TopToolbar";
import StatusBar, { type StatusMessage } from "./ui/components/StatusBar";

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

  const statusMessages: StatusMessage[] = useMemo(() => {
    const msgs: StatusMessage[] = [];
    if (error) msgs.push({ level: "error", text: error });

    if (editablePreset?.warnings?.length) {
      for (const w of editablePreset.warnings) msgs.push({ level: "warning", text: w });
    }
    return msgs;
  }, [error, editablePreset]);

  return (
    <div className="container" style={{ maxWidth: 1200, marginInline: "auto" }}>
      <TopToolbar
        onPickFolder={chooseFolder}
        isBusy={isBusy}
        folderPath={folderPath}
        presets={presetFiles}
        selectedFile={selectedFile}
        onSelectPreset={async (f) => {
          setSelectedPadKey(null);
          setEditablePreset(null);
          await openPresetFile(f);
        }}
      />

      <div className="bb-main">
        {!selectedFile ? (
          <p style={{ opacity: 0.8 }}>Select a preset (use the dropdown in the toolbar).</p>
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
              }}
            />

            {/* Parsed model → Grid + Details */}
            <h2 style={{ marginTop: 16 }}>Parsed pads</h2>

            {!editablePreset ? (
              <p style={{ opacity: 0.8 }}>No parsed preset.</p>
            ) : (
              <PresetDetails
                preset={editablePreset}
                selectedPadKey={selectedPadKey}
                onSelectPad={setSelectedPadKey}
                onCreatePad={(row, column) => {
                  setEditablePreset((prev) => (prev ? ensurePadAt(prev, row, column, { gridCols: 4 }) : prev));
                  setSelectedPadKey(`r${row}c${column}`);
                }}
              />
            )}
          </>
        )}
      </div>

      <StatusBar messages={statusMessages} />
    </div>
  );
}
