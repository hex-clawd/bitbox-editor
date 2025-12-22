import React, { useMemo } from "react";
import type { Pad } from "../../../core/domain/bitboxPreset";
import ParamRowsSection from "./ParamRowsSection";
import { buildBlackboxConfRows } from "../../viewModels/blackboxParamView";

type Props = {
    pad: Pad;
};

function getPadParams(pad: unknown): Record<string, string> {
    // Keep UI resilient to minor domain refactors: support common field names.
    const anyPad = pad as { params?: Record<string, string>; rawParams?: Record<string, string> };
    return anyPad.params ?? anyPad.rawParams ?? {};
}

export default function PadConfParamsSection({ pad }: Props) {
    const rows = useMemo(() => buildBlackboxConfRows(getPadParams(pad)), [pad]);

    return <ParamRowsSection title="Conf params" rows={rows} emptyText="No conf params found on this pad." />;
}
