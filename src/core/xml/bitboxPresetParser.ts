import type { BitboxPreset, Pad, SampleRef } from "../domain/bitboxPreset";

export type ParseResult =
    | { ok: true; preset: BitboxPreset }
    | { ok: false; error: string; preset?: BitboxPreset };

const SAMPLE_ATTR_CANDIDATES = [
    "sample",
    "file",
    "filename",
    "path",
    "wav",
    "wave",
    "audio",
    "source",
];

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
    // Strip embedded NUL bytes (Bitbox/Blackbox exports sometimes contain trailing 0x00)
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

    // --- Parse pads/cells ---
    const padElements = [
        ...Array.from(doc.getElementsByTagName("pad")),
        ...Array.from(doc.getElementsByTagName("Pad")),
    ];

    let pads: Pad[] = [];
    let sampleRefs: SampleRef[] = [];

    if (padElements.length > 0) {
        // Bitbox-style (not your current Blackbox file, but keep for later)
        for (const padEl of padElements) {
            const pad = parsePad(padEl, warnings);
            pads.push(pad);
            for (const r of pad.sampleRefs) sampleRefs.push(r);
        }
    } else {
        // Blackbox-style: <cell row="" column="" layer="" filename="">
        const cellEls = doc.getElementsByTagName("cell");
        if (cellEls.length > 0) {
            const parsed = parseBlackboxCells(doc, warnings);
            pads = parsed.pads;
            sampleRefs = parsed.sampleRefs;
        } else {
            warnings.push(
                "No <pad> or <cell> elements found (schema might differ). Will still scan for sample references globally."
            );
        }
    }

    // Global scan as a catch-all (still useful while schema is evolving)
    const globalRefs = scanSampleRefsGlobally(doc, warnings);
    for (const r of globalRefs) sampleRefs.push(r);

    // Deduplicate by path + padIndex + hint
    const deduped = dedupeSampleRefs(sampleRefs);

    const preset: BitboxPreset = {
        name: presetName,
        pads,
        sampleRefs: deduped,
        warnings,
        rawXml: inputXml, // keep original (unsanitized) for debugging; you can switch to xml if you prefer
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
    const allRefs: SampleRef[] = [];

    for (const [key, els] of groups.entries()) {
        const [rowStr, colStr] = key.split(",");
        const row = Number(rowStr);
        const col = Number(colStr);

        // Make a stable index (row-major) for now
        const padIndex = row * gridWidth + col;

        const refsForPad: SampleRef[] = [];

        for (const cellEl of els) {
            const layer = parseIntSafe(cellEl.getAttribute("layer")) ?? 0;

            // In Blackbox presets, sample path is typically in cell@filename
            // Do NOT enforce ".wav" extension; some refs can be non-wav or symbolic.
            const filename = cellEl.getAttribute("filename")?.trim();
            if (filename) {
                refsForPad.push({
                    path: filename,
                    source: "attribute",
                    padIndex,
                    xmlHint: `cell[row=${row},col=${col},layer=${layer}]@filename`,
                });
            }

            // You can extend here later to pull other file-like refs from nested nodes.
        }

        const pad: Pad = {
            index: padIndex,
            name: undefined,
            sampleRefs: refsForPad,
            meta: {
                row: String(row),
                column: String(col),
            },
        };

        pads.push(pad);
        for (const r of refsForPad) allRefs.push(r);
    }

    // Sort pads in row-major order
    pads.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    return { pads, sampleRefs: dedupeSampleRefs(allRefs) };
}

// -------------------------
// Bitbox-style parsing: <pad>
// -------------------------

function parsePad(padEl: Element, warnings: string[]): Pad {
    const padIndex =
        parseIntSafe(padEl.getAttribute("index")) ??
        parseIntSafe(padEl.getAttribute("i")) ??
        parseIntSafe(padEl.getAttribute("num")) ??
        parseIntSafe(padEl.getAttribute("id"));

    const padName = padEl.getAttribute("name")?.trim() || padEl.getAttribute("label")?.trim() || undefined;

    const refs = extractSampleRefsFromElement(padEl, padIndex);

    // Capture some attributes as meta (handy during schema discovery)
    const meta: Record<string, string> = {};
    for (const a of Array.from(padEl.attributes)) {
        if (a.name && a.value && !SAMPLE_ATTR_CANDIDATES.includes(a.name)) {
            meta[a.name] = a.value;
        }
    }

    return {
        index: padIndex,
        name: padName,
        sampleRefs: refs,
        meta: Object.keys(meta).length ? meta : undefined,
    };
}

function extractSampleRefsFromElement(el: Element, padIndex?: number): SampleRef[] {
    const out: SampleRef[] = [];

    // 1) Attributes like sample=".../kick.wav"
    for (const attrName of SAMPLE_ATTR_CANDIDATES) {
        const v = el.getAttribute(attrName);
        if (v && looksLikeAudioPath(v)) {
            out.push({
                path: v,
                source: "attribute",
                padIndex,
                xmlHint: `${el.tagName}@${attrName}`,
            });
        }
    }

    // 2) Nested elements often used: <sample><file>...</file></sample>, etc.
    const nestedTagCandidates = ["sample", "Sample", "file", "File", "path", "Path", "filename", "Filename"];
    for (const tag of nestedTagCandidates) {
        for (const node of Array.from(el.getElementsByTagName(tag))) {
            const t = node.textContent?.trim();
            if (t && looksLikeAudioPath(t)) {
                out.push({
                    path: t,
                    source: "text",
                    padIndex,
                    xmlHint: `${el.tagName}/${tag}`,
                });
            }
        }
    }

    return out;
}

// -------------------------
// Global scan (catch-all)
// -------------------------

function scanSampleRefsGlobally(doc: Document, warnings: string[]): SampleRef[] {
    const out: SampleRef[] = [];
    const all = doc.getElementsByTagName("*");

    for (const el of Array.from(all)) {
        // Harvest any attribute that looks like it contains an audio file path
        for (const a of Array.from(el.attributes)) {
            if (looksLikeAudioPath(a.value)) {
                out.push({
                    path: a.value,
                    source: "attribute",
                    xmlHint: `${el.tagName}@${a.name}`,
                });
            }
        }

        // Harvest text nodes that look like an audio file path (rare, but possible)
        const t = el.textContent?.trim();
        if (t && looksLikeAudioPath(t) && t.length < 512) {
            out.push({
                path: t,
                source: "text",
                xmlHint: `${el.tagName}#text`,
            });
        }
    }

    if (out.length === 0) {
        warnings.push("No audio-like references found during global scan.");
    }

    return out;
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
 * - Multiple XML docs are concatenated (rare)
 *
 * Best-effort. Only used when initial DOMParser returns parsererror.
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

    // If multiple docs concatenated, attempt to keep only up to the first root closing tag.
    const rootTag = detectFirstRootTagName(s);
    if (rootTag) {
        const closeTag = `</${rootTag}>`;
        const lastClose = s.lastIndexOf(closeTag);
        if (lastClose >= 0) {
            const end = lastClose + closeTag.length;
            if (end < s.length) {
                warnings.push(`Stripped trailing content after </${rootTag}> (possible concatenated XML or junk).`);
                s = s.slice(0, end);
            }
        }
    }

    return { xml: s, warnings };
}

function detectFirstRootTagName(xml: string): string | null {
    let s = xml;

    // Strip xml declaration
    s = s.replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, "");

    // Strip leading comments
    while (s.startsWith("<!--")) {
        const end = s.indexOf("-->");
        if (end < 0) break;
        s = s.slice(end + 3).trimStart();
    }

    // Strip doctype
    s = s.replace(/^\s*<!DOCTYPE[\s\S]*?>\s*/i, "");

    const m = s.match(/^\s*<([A-Za-z_][A-Za-z0-9_\-:.]*)\b/);
    return m?.[1] ?? null;
}

// -------------------------
// Utilities
// -------------------------

function looksLikeAudioPath(s: string): boolean {
    const v = s.trim();
    if (!v) return false;

    const lower = v.toLowerCase();
    return (
        lower.endsWith(".wav") ||
        lower.endsWith(".aif") ||
        lower.endsWith(".aiff") ||
        lower.endsWith(".flac") ||
        lower.endsWith(".mp3")
    );
}

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