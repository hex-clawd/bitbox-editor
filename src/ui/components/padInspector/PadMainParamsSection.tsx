import React, { useMemo } from "react";
import type { Pad } from "../../../core/domain/bitboxPreset";
import ParamRowsSection from "./ParamRowsSection";
import { buildBlackboxMainRows } from "../../viewModels/blackboxParamView";

type Props = {
    pad: Pad;
};

function getPadParams(pad: unknown): Record<string, string> {
    // Keep UI resilient to minor domain refactors: support common field names.
    const anyPad = pad as { params?: Record<string, string>; rawParams?: Record<string, string> };
    return anyPad.params ?? anyPad.rawParams ?? {};
}

export default function PadMainParamsSection({ pad }: Props) {
    const rows = useMemo(() => buildBlackboxMainRows(getPadParams(pad)), [pad]);

    return <ParamRowsSection title="Main params" rows={rows} emptyText="No main params found on this pad." />;
}
