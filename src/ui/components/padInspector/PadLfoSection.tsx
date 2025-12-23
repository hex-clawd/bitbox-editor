import React, { useMemo } from "react";
import type { Pad } from "../../../core/domain/bitboxPreset";
import { buildBlackboxLfoRows } from "../../viewModels/blackboxParamView";
import ParamRowsSection from "./ParamRowsSection";

type Props = { pad: Pad };

export default function PadLfoSection({ pad }: Props) {
  const rows = useMemo(() => buildBlackboxLfoRows(pad.params), [pad.params]);
  return <ParamRowsSection title="LFO" rows={rows} />;
}
