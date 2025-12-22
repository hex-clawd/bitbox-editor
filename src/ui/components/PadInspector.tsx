import React, { useState } from "react";
import type { Pad } from "../../core/domain/bitboxPreset";
import PadInspectorHeader from "./padInspector/PadInspectorHeader";
import PadMainParamsSection from "./padInspector/PadMainParamsSection";
import PadConfParamsSection from "./padInspector/PadConfParamsSection";
import PadSlicesSection from "./padInspector/PadSlicesSection";
import PadMultisampleMappingSection from "./padInspector/PadMultisampleMappingSection";
import PadRawParamsModal from "./padInspector/PadRawParamsModal";

type Props = {
    pad: Pad;
};

export default function PadInspector({ pad }: Props) {
    const [isRawOpen, setIsRawOpen] = useState(false);

    return (
        <>
            <div style={{ display: "grid", gap: 14 }}>
                <PadInspectorHeader pad={pad} />

                {/* Debug-only control: keep it out of the normal sections */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                        onClick={() => setIsRawOpen(true)}
                        style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.18)",
                            background: "rgba(255,255,255,0.06)",
                            color: "inherit",
                            cursor: "pointer",
                            fontSize: 12,
                            opacity: 0.9,
                        }}
                        title="Debug: show all raw params"
                    >
                        Raw params…
                    </button>
                </div>

                <PadMainParamsSection pad={pad} />
                <PadConfParamsSection pad={pad} />
                <PadSlicesSection pad={pad} />
                <PadMultisampleMappingSection pad={pad} />
            </div>

            <PadRawParamsModal pad={pad} isOpen={isRawOpen} onClose={() => setIsRawOpen(false)} />
        </>
    );
}
