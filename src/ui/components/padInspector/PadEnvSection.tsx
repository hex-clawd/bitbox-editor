import { useMemo } from "react";
import type { Pad } from "../../../core/domain/bitboxPreset";
import { buildBlackboxEnvRows } from "../../viewModels/blackboxParamView";
import ParamRowsSection from "./ParamRowsSection";

type Props = { pad: Pad };

export default function PadEnvSection({ pad }: Props) {
  const rows = useMemo(() => buildBlackboxEnvRows(pad.params), [pad.params]);
  return <ParamRowsSection title="Env" rows={rows} />;
}
