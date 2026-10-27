import { useMemo } from "react";
import type { Pad } from "../../../core/domain/bitboxPreset";
import { buildBlackboxPosRows } from "../../viewModels/blackboxParamView";
import ParamRowsSection from "./ParamRowsSection";

type Props = { pad: Pad };

export default function PadPosSection({ pad }: Props) {
  const rows = useMemo(() => buildBlackboxPosRows(pad.params), [pad.params]);
  return <ParamRowsSection title="Pos" rows={rows} />;
}
