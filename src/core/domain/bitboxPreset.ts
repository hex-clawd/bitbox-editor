export type BitboxPreset = {
    /** Best-effort preset name (derived from XML or filename by controller later) */
    name?: string;

    /** Pads we can detect */
    pads: Pad[];

    /** All referenced sample paths found in the preset */
    sampleRefs: SampleRef[];

    /** Non-fatal issues found while parsing */
    warnings: string[];

    /** Useful for debugging/roundtrip during early development */
    rawXml: string;
};

export type Pad = {
    /** 0..15 or 1..16 depending on what XML provides; we keep whatever we find */
    index?: number;

    /** Pad name/label if present */
    name?: string;

    /** Sample refs directly associated with this pad (best-effort) */
    sampleRefs: SampleRef[];

    /** If you want to keep unknown pad fields later */
    meta?: Record<string, string>;
};

export type SampleRef = {
    /** Original string found in XML (path, filename, etc.) */
    path: string;

    /** Where we found it (helps debugging + later serializer decisions) */
    source: "attribute" | "text";

    /** Optional context */
    padIndex?: number;
    xmlHint?: string; // e.g. "pad@sample", "sample/file", etc.
};