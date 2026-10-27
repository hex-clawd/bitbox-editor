import "./App.css";
import { useEffect, useMemo, useState } from "react";

import { usePresetBrowser } from "./ui/hooks/usePresetBrowser";
import PresetDetails from "./ui/components/PresetDetails";
import TopToolbar from "./ui/components/TopToolbar";
import StatusBar, { type StatusMessage } from "./ui/components/StatusBar";
import XmlPreviewModal from "./ui/components/debug/XmlPreviewModal";

import type { BitboxPreset } from "./core/domain/bitboxPreset";
import { ensurePadAt } from "./core/domain/presetEdit";

export default function App() {
  const {
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
  const [editablePreset, setEditablePreset] = useState<BitboxPreset | null>(null);
  const [isXmlOpen, setIsXmlOpen] = useState(false);

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
    <div className="container">
      <TopToolbar
        onPickFolder={chooseFolder}
        isBusy={isBusy}
        presets={presetFiles}
        selectedFile={selectedFile}
        onSelectPreset={async (f) => {
          setSelectedPadKey(null);
          setEditablePreset(null);
          await openPresetFile(f);
        }}
        onShowXml={() => setIsXmlOpen(true)}
        canShowXml={!!selectedText}
      />

      <div className="bb-main">
        {!selectedFile ? (
          <p style={{ opacity: 0.8 }}>Select a preset (use the dropdown in the toolbar).</p>
        ) : !editablePreset ? (
          <p style={{ opacity: 0.8 }}>No parsed preset.</p>
        ) : (
          <PresetDetails
            preset={editablePreset}
            selectedPadKey={selectedPadKey}
            onSelectPad={setSelectedPadKey}
            onCreatePad={(row, column) => {
              setEditablePreset((prev) =>
                prev ? ensurePadAt(prev, row, column, { gridCols: 4 }) : prev
              );
              setSelectedPadKey(`r${row}c${column}`);
            }}
          />
        )}
      </div>

      <StatusBar messages={statusMessages} />

      <XmlPreviewModal
        xmlText={selectedText}
        isOpen={isXmlOpen}
        onClose={() => setIsXmlOpen(false)}
      />
    </div>
  );
}
