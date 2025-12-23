import React from "react";
import type { Pad } from "../../core/domain/bitboxPreset";
import PadInspectorHeader from "./padInspector/PadInspectorHeader";
import PadMainParamsSection from "./padInspector/PadMainParamsSection";
import PadEnvSection from "./padInspector/PadEnvSection";
import PadLfoSection from "./padInspector/PadLfoSection";
import PadPosSection from "./padInspector/PadPosSection";
import PadConfParamsSection from "./padInspector/PadConfParamsSection";
import PadGranSection from "./padInspector/PadGranSection";
import PadSlicesSection from "./padInspector/PadSlicesSection";
import PadMultisampleMappingSection from "./padInspector/PadMultisampleMappingSection";

type Props = {
  pad: Pad;
};

export default function PadInspector({ pad }: Props) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <PadInspectorHeader pad={pad} />

      {/* UI order only: Main → LFO → Env → Pos */}
      <PadMainParamsSection pad={pad} />
      <PadLfoSection pad={pad} />
      <PadEnvSection pad={pad} />
      <PadPosSection pad={pad} />

      <PadConfParamsSection pad={pad} />
      <PadGranSection pad={pad} />

      <PadSlicesSection pad={pad} />
      <PadMultisampleMappingSection pad={pad} />
    </div>
  );
}
