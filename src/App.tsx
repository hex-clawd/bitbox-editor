import { useMemo, useState } from "react";
import "./App.css";

import { open } from "@tauri-apps/plugin-dialog";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";

type ListedFile = {
  name: string;
  path: string;
  isDir: boolean;
};

export default function App() {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [items, setItems] = useState<ListedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const [selectedFile, setSelectedFile] = useState<ListedFile | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");

  const presetFiles = useMemo(
    () =>
      items
        .filter((x) => !x.isDir)
        .filter((x) => x.name.toLowerCase().endsWith(".xml")),
    [items]
  );

  async function chooseFolder() {
    setError(null);

    const selected = await open({
      title: "Choose Bitbox preset folder",
      directory: true,
      multiple: false,
    });

    if (!selected) return;
    if (Array.isArray(selected)) return;

    setFolderPath(selected);
    setSelectedFile(null);
    setSelectedText("");

    try {
      setIsBusy(true);

      const entries = await readDir(selected, { recursive: false });

      const mapped: ListedFile[] = entries.map((e) => {
        const name = e.name ?? "(no name)";
        const fullPath =
            e.path ??
            (selected.endsWith("/") ? `${selected}${name}` : `${selected}/${name}`);

        return {
          name,
          path: fullPath,
          isDir: !!e.children, // fine for now
        };
      });

      setItems(mapped);
    } catch (err) {
      setError(String(err));
      setItems([]);
    } finally {
      setIsBusy(false);
    }
  }

  async function openPresetFile(file: ListedFile) {
    console.log("clicked", file.path);
    console.log("clicked", file.path);

    setError(null);
    setSelectedFile(file);
    setSelectedText("");

    try {
      setIsBusy(true);
      const text = await readTextFile(file.path);
      setSelectedText(text);
    } catch (err) {
      setError(String(err));
      setSelectedFile(null);
      setSelectedText("");
    } finally {
      setIsBusy(false);
    }
  }

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
              {folderPath
                ? "No .xml files found in this folder."
                : "Pick a folder to list files."}
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

        {/* Right: file contents */}
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
                  minHeight: 520,
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}