import type { BitboxPreset, FileRef, Pad, PadLayer, SampleRef } from "../domain/bitboxPreset";

export type ParseResult =
    | { ok: true; preset: BitboxPreset }
    | { ok: false; error: string; preset?: BitboxPreset };

const PRESET_NAME_ATTR_CANDIDATES = ["name", "presetName", "title"];

/**
 * Best-effort Bitbox/Blackbox preset parser.
 * Pure: no file system, no UI.
 *
 * Supports:
 * - Blackbox format: <cell row="" column="" layer="" filename="">
 * - (Future) Bitbox format: <pad ...>
 */
export function parseBitboxPresetXml(inputXml: string): ParseResult {
    // Strip embedded NUL bytes (exports sometimes contain trailing 0x00)
    let xml = stripNulBytes(inputXml);

    const warnings: string[] = [];
    const trimmed = xml.trim();
    if (!trimmed) return { ok: false, error: "XML is empty." };

    let doc: Document;
    try {
        const parser = new DOMParser();
        doc = parser.parseFromString(xml, "application/xml");
    } catch (e) {
        return { ok: false, error: `DOMParser failed: ${String(e)}` };
    }

    // Detect parsererror
    const parserError = doc.getElementsByTagName("parsererror")[0];
    if (parserError) {
        // Retry with salvage (handles "extra content at end of document" cases too)
        const salvaged = salvageLikelyXmlDocument(xml);
        if (salvaged.xml !== xml) {
            const parser2 = new DOMParser();
            const doc2 = parser2.parseFromString(salvaged.xml, "application/xml");
            const parserError2 = doc2.getElementsByTagName("parsererror")[0];
            if (!parserError2) {
                doc = doc2;
                warnings.push(...salvaged.warnings);
            } else {
                return {
                    ok: false,
                    error: `Invalid XML (after salvage): ${parserError2.textContent ?? "parsererror"}`,
                };
            }
        } else {
            return { ok: false, error: `Invalid XML: ${parserError.textContent ?? "parsererror"}` };
        }
    }

    const presetName = detectPresetName(doc, warnings);

    // --- Blackbox-style: <cell> ---
    const cellEls = doc.getElementsByTagName("cell");
    let pads: Pad[] = [];
    let sampleRefs: SampleRef[] = [];

    if (cellEls.length > 0) {
        const parsed = parseBlackboxCells(doc, warnings);
        pads = parsed.pads;
        sampleRefs = parsed.sampleRefs;
    } else {
        warnings.push("No <cell> elements found (not a Blackbox preset?). Bitbox <pad> parsing not implemented yet.");
    }

    // Deduplicate refs
    sampleRefs = dedupeSampleRefs(sampleRefs);

    const preset: BitboxPreset = {
        name: presetName,
        pads,
        sampleRefs,
        warnings,
        rawXml: inputXml,
    };

    return { ok: true, preset };
}

// -------------------------
// Blackbox parsing: <cell>
// -------------------------

function parseBlackboxCells(doc: Document, warnings: string[]): { pads: Pad[]; sampleRefs: SampleRef[] } {
    const cellEls = Array.from(doc.getElementsByTagName("cell"));
    if (cellEls.length === 0) {
        warnings.push("No <cell> elements found.");
        return { pads: [], sampleRefs: [] };
    }

    // Infer grid size (columns are 0-based in your file)
    const coords = cellEls.map((el) => ({
        row: parseIntSafe(el.getAttribute("row")),
        col: parseIntSafe(el.getAttribute("column")),
    }));
    const maxCol = Math.max(...coords.map((c) => c.col ?? -1));
    const gridWidth = Math.max(1, maxCol + 1);

    // Group by (row,col) -> multiple layers
    const keyOf = (row: number, col: number) => `${row},${col}`;
    const groups = new Map<string, Element[]>();

    for (const el of cellEls) {
        const row = parseIntSafe(el.getAttribute("row"));
        const col = parseIntSafe(el.getAttribute("column"));
        if (row == null || col == null) continue;

        const key = keyOf(row, col);
        const arr = groups.get(key);
        if (arr) arr.push(el);
        else groups.set(key, [el]);
    }

    const pads: Pad[] = [];
    const refs: SampleRef[] = [];

    for (const [key, els] of groups.entries()) {
        const [rowStr, colStr] = key.split(",");
        const row = Number(rowStr);
        const column = Number(colStr);

        const padIndex = row * gridWidth + column;

        // Build layers (one per <cell ... layer="x" ...>)
        const layers: PadLayer[] = els
            .map((cellEl) => {
                const layerIndex = parseIntSafe(cellEl.getAttribute("layer")) ?? 0;
                const filename = cellEl.getAttribute("filename")?.trim() ?? undefined;

                const fileRef = filename ? classifyFileRef(filename) : undefined;

                // (Optional) capture some other interesting attributes later
                const meta: Record<string, string> = {};
                for (const a of Array.from(cellEl.attributes)) {
                    if (a.name === "row" || a.name === "column" || a.name === "layer" || a.name === "filename") continue;
                    meta[a.name] = a.value;
                }

                // Emit a SampleRef entry if filename exists
                if (filename) {
                    refs.push({
                        path: filename,
                        source: "attribute",
                        padIndex,
                        xmlHint: `cell[row=${row},col=${column},layer=${layerIndex}]@filename`,
                        refKind: fileRef?.kind ?? "unknown",
                    });
                }

                const layer: PadLayer = {
                    layerIndex,
                    filename,
                    fileRef,
                    meta: Object.keys(meta).length ? meta : undefined,
                };

                return layer;
            })
            .sort((a, b) => a.layerIndex - b.layerIndex);

        pads.push({
            index: padIndex,
            grid: { row, column },
            layers,
            meta: undefined,
        });
    }

    pads.sort((a, b) => a.index - b.index);

    return { pads, sampleRefs: refs };
}

function classifyFileRef(value: string): FileRef {
    const v = value.trim();
    if (!v) return { kind: "unknown", value };

    const lower = v.toLowerCase();

    // Blackbox presets use backslashes in paths; keep as-is.
    // A "folder" ref typically has no extension.
    const extMatch = lower.match(/\.([a-z0-9]{1,8})$/);
    if (extMatch) {
        const ext = extMatch[1];
        return { kind: "sample", path: v, ext };
    }

    // If it looks like a path-ish string, treat as folder.
    // (This matches your examples like \BB_Samples\BB_DRUM_SOURCE\BD)
    if (v.includes("\\") || v.includes("/")) {
        return { kind: "folder", path: v };
    }

    return { kind: "unknown", value: v };
}

// -------------------------
// Name detection
// -------------------------

function detectPresetName(doc: Document, warnings: string[]): string | undefined {
    const root = doc.documentElement;
    if (root) {
        for (const attr of PRESET_NAME_ATTR_CANDIDATES) {
            const v = root.getAttribute(attr);
            if (v && v.trim()) return v.trim();
        }
    }

    const nameTags = [...Array.from(doc.getElementsByTagName("name")), ...Array.from(doc.getElementsByTagName("Name"))];
    const nameText = nameTags[0]?.textContent?.trim();
    if (nameText) return nameText;

    warnings.push("Preset name not found in XML (will likely use filename).");
    return undefined;
}

// -------------------------
// XML salvage + hygiene
// -------------------------

function stripNulBytes(s: string): string {
    return s.replace(/\u0000/g, "");
}

/**
 * Attempts to salvage a single XML document if:
 * - There is junk before/after it (including "extra content at end")
 */
function salvageLikelyXmlDocument(input: string): { xml: string; warnings: string[] } {
    const warnings: string[] = [];
    let s = stripNulBytes(input).trim();

    // Start from XML declaration if present, else from first '<'
    const xmlDecl = s.indexOf("<?xml");
    if (xmlDecl >= 0) s = s.slice(xmlDecl);
    else {
        const firstLt = s.indexOf("<");
        if (firstLt > 0) {
            warnings.push(`Stripped ${firstLt} leading characters before first '<'.`);
            s = s.slice(firstLt);
        }
    }

    // Cut anything after last '>' (simple trailing junk removal)
    const lastGt = s.lastIndexOf(">");
    if (lastGt >= 0 && lastGt < s.length - 1) {
        warnings.push(`Stripped ${s.length - (lastGt + 1)} trailing characters after last '>'.`);
        s = s.slice(0, lastGt + 1);
    }

    return { xml: s, warnings };
}

// -------------------------
// Utilities
// -------------------------

function parseIntSafe(v: string | null): number | undefined {
    if (!v) return undefined;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
}

function dedupeSampleRefs(refs: SampleRef[]): SampleRef[] {
    const seen = new Set<string>();
    const out: SampleRef[] = [];
    for (const r of refs) {
        const key = `${r.path}||${r.padIndex ?? ""}||${r.xmlHint ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(r);
    }
    return out;
}