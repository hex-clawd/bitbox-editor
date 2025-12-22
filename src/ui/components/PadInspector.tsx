import React from "react";
import type { Pad } from "../../core/domain/bitboxPreset";
import PadInspectorHeader from "./padInspector/PadInspectorHeader";
import PadMainParamsSection from "./padInspector/PadMainParamsSection";
import PadConfParamsSection from "./padInspector/PadConfParamsSection";
import PadRawParamsSection from "./padInspector/PadRawParamsSection";
import PadSlicesSection from "./padInspector/PadSlicesSection";
import PadMultisampleMappingSection from "./padInspector/PadMultisampleMappingSection";

type Props = {
    pad: Pad;
};

export default function PadInspector({ pad }: Props) {
    return (
        <div style={{ display: "grid", gap: 14 }}>
            <PadInspectorHeader pad={pad} />
            <PadMainParamsSection pad={pad} />
            <PadConfParamsSection pad={pad} />
            <PadRawParamsSection pad={pad} />
            <PadSlicesSection pad={pad} />
            <PadMultisampleMappingSection pad={pad} />
        </div>
    );
}
