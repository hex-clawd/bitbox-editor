export type BitboxPreset = {
    /** Best-effort preset name (derived from XML or filename by controller later) */
    name?: string;

    /** Grid pads/cells (Blackbox) or pads (Bitbox later) */
    pads: Pad[];

    /** All referenced sample-ish paths found in the preset */
    sampleRefs: SampleRef[];

    /** Non-fatal issues found while parsing */
    warnings: string[];

    /** Useful for debugging/roundtrip during early development */
    rawXml: string;
};

export type Pad = {
    /** A stable index used for UI ordering (row-major for Blackbox) */
    index: number;

    /** Blackbox grid position if available */
    grid?: { row: number; column: number };

    /** Optional label/name if present */
    name?: string;

    /** Layers inside a pad (Blackbox cell layers, Bitbox layers later) */
    layers: PadLayer[];

    /** If you want to keep unknown pad fields later */
    meta?: Record<string, string>;
};

export type PadLayer = {
    layerIndex: number;

    /** Raw `filename` attribute from XML (Blackbox) */
    filename?: string;

    /** Classified interpretation of filename */
    fileRef?: FileRef;

    /** Optional fields you may extract later (type, gain, loop, etc.) */
    meta?: Record<string, string>;
};

export type FileRef =
    | { kind: "sample"; path: string; ext: string }
    | { kind: "folder"; path: string }
    | { kind: "unknown"; value: string };

export type SampleRef = {
    /** Original string found in XML (path, filename, etc.) */
    path: string;

    /** Where we found it (helps debugging + later serializer decisions) */
    source: "attribute" | "text";

    /** Optional context */
    padIndex?: number;
    xmlHint?: string;

    /** Classification */
    refKind?: "sample" | "folder" | "unknown";
};