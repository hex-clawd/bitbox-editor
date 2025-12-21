import React from "react";
import type { ListedFile } from "../../services/fs/tauriFs";

type Props = {
    files: ListedFile[];
    selectedPath: string | null;
    isBusy: boolean;
    onOpenFile: (file: ListedFile) => void;
};

export default function PresetFileList({ files, selectedPath, isBusy, onOpenFile }: Props) {
    if (files.length === 0) {
        return <p style={{ opacity: 0.8 }}>No .xml files found.</p>;
    }

    return (
        <div
            style={{
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                overflow: "hidden",
            }}
        >
            {files.map((f) => {
                const isActive = selectedPath === f.path;
                return (
                    <button
                        key={f.path}
                        onClick={() => onOpenFile(f)}
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
    );
}