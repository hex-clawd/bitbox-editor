import React, { useMemo } from "react";
import type { Pad } from "../../../core/domain/bitboxPreset";
import { buildBlackboxGranRows } from "../../viewModels/blackboxParamView";
import ParamRowsSection from "./ParamRowsSection";

type Props = { pad: Pad };

export default function PadGranSection({ pad }: Props) {
  const rows = useMemo(() => buildBlackboxGranRows(pad.params), [pad.params]);
  return <ParamRowsSection title="Gran" rows={rows} />;
}
