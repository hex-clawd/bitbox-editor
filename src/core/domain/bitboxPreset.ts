export type BitboxPreset = {
    name?: string;

    /** Blackbox pads parsed from document > session (type="sample" etc.) */
    pads: Pad[];

    /** Convenience: all file references discovered (pads + assets), for future file ops */
    sampleRefs: SampleRef[];

    warnings: string[];
    rawXml: string;
};

export type Pad = {
    /** Stable index for ordering, derived from row/column (row-major by inferred grid width) */
    index: number;

    grid: { row: number; column: number };

    /** From pad cell@type (e.g. "sample") */
    type: string;

    /** For type="sample", we classify based on params + presence of <slices> etc. */
    sampleKind?: "slice" | "multisample" | "single" | "unknown";

    /** The pad cell's filename attribute (can be a .wav OR a folder path root) */
    filename?: string;

    /** Parsed params from the pad cell (<params .../>) */
    params: Record<string, string>;

    /** If the pad has explicit slices */
    slices?: number[]; // slice positions

    /** Assets linked to this pad (multisample, etc.) */
    assets: AssetRef[];

    /** Any extra info we want to keep without understanding yet */
    meta?: Record<string, string>;
};

export type AssetRef = {
    filename: string;
    params: Record<string, string>;

    /** Where this asset points (asssrcrow/asssrccol), if present */
    sourcePad?: { row: number; column: number };

    /** Extracted convenience fields if present */
    rootnote?: number;
    keyrange?: { bottom?: number; top?: number };
    velrange?: { bottom?: number; top?: number };
};

export type SampleRef = {
    path: string;

    /** "pad" for pad cell@filename, "asset" for asset cell@filename */
    role: "pad" | "asset";

    padIndex?: number;
    xmlHint?: string;

    /** Classification helpful for future safe file ops */
    refKind?: "sample" | "folder" | "unknown";
};