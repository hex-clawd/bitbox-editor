import React, { useEffect } from "react";
import type { Pad } from "../../../core/domain/bitboxPreset";
import PadRawParamsSection from "./PadRawParamsSection";

type Props = {
    pad: Pad;
    isOpen: boolean;
    onClose: () => void;
};

export default function PadRawParamsModal({ pad, isOpen, onClose }: Props) {
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Raw pad params"
            onMouseDown={(e) => {
                // Close on backdrop click (but not when clicking inside the dialog)
                if (e.target === e.currentTarget) onClose();
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(0,0,0,0.55)",
                display: "grid",
                placeItems: "center",
                padding: 16,
            }}
        >
            <div
                style={{
                    width: "min(980px, 92vw)",
                    maxHeight: "min(86vh, 860px)",
                    overflow: "auto",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(20,20,20,0.95)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
                    padding: 14,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 10,
                    }}
                >
                    <div style={{ fontWeight: 800 }}>All params (raw)</div>

                    <button
                        onClick={onClose}
                        style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.22)",
                            background: "rgba(255,255,255,0.08)",
                            color: "inherit",
                            cursor: "pointer",
                        }}
                        aria-label="Close raw params"
                        title="Close (Esc)"
                    >
                        Close
                    </button>
                </div>

                {/* Reuse existing debug section content */}
                <PadRawParamsSection pad={pad} />
            </div>
        </div>
    );
}
