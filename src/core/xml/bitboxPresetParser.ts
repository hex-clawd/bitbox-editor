import type { BitboxPreset, Pad, SampleRef } from "../domain/bitboxPreset";

export type ParseResult = {
    ok: true;
    preset: BitboxPreset;
} | {
    ok: false;
    error: string;
    preset?: BitboxPreset; // optional partial result
};

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
 * Best-effort Bitbox preset parser.
 * Pure: no file system, no UI.
 */
export function parseBitboxPresetXml(xml: string): ParseResult {
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
        return { ok: false, error: `Invalid XML: ${parserError.textContent ?? "parsererror"}` };
    }

    const presetName = detectPresetName(doc, warnings);

    // Pads: try common tag names (case-sensitive in XML, so check variants)
    const padElements = [
        ...Array.from(doc.getElementsByTagName("pad")),
        ...Array.from(doc.getElementsByTagName("Pad")),
    ];

    const pads: Pad[] = [];
    const sampleRefs: SampleRef[] = [];

    if (padElements.length === 0) {
        warnings.push("No <pad> elements found (schema might differ). Will still scan for sample references globally.");
    } else {
        for (const padEl of padElements) {
            const pad = parsePad(padEl, warnings);
            pads.push(pad);
            for (const r of pad.sampleRefs) sampleRefs.push(r);
        }
    }

    // Global scan for sample-ish refs anywhere in the document (catch-all)
    // This helps you discover the real schema quickly.
    const globalRefs = scanSampleRefsGlobally(doc, warnings);
    for (const r of globalRefs) sampleRefs.push(r);

    // Deduplicate by path + padIndex + hint
    const deduped = dedupeSampleRefs(sampleRefs);

    const preset: BitboxPreset = {
        name: presetName,
        pads,
        sampleRefs: deduped,
        warnings,
        rawXml: xml,
    };

    return { ok: true, preset };
}

function detectPresetName(doc: Document, warnings: string[]): string | undefined {
    // Try root attribute candidates
    const root = doc.documentElement;
    if (root) {
        for (const attr of PRESET_NAME_ATTR_CANDIDATES) {
            const v = root.getAttribute(attr);
            if (v && v.trim()) return v.trim();
        }
    }

    // Try <name> tag
    const nameTags = [
        ...Array.from(doc.getElementsByTagName("name")),
        ...Array.from(doc.getElementsByTagName("Name")),
    ];
    const nameText = nameTags[0]?.textContent?.trim();
    if (nameText) return nameText;

    warnings.push("Preset name not found in XML (will likely use filename).");
    return undefined;
}

function parsePad(padEl: Element, warnings: string[]): Pad {
    const padIndex =
        parseIntSafe(padEl.getAttribute("index")) ??
        parseIntSafe(padEl.getAttribute("i")) ??
        parseIntSafe(padEl.getAttribute("num")) ??
        parseIntSafe(padEl.getAttribute("id"));

    const padName =
        padEl.getAttribute("name")?.trim() ||
        padEl.getAttribute("label")?.trim() ||
        undefined;

    const refs = extractSampleRefsFromElement(padEl, padIndex);

    // Optional: capture some attributes as meta (handy during schema discovery)
    const meta: Record<string, string> = {};
    for (const a of Array.from(padEl.attributes)) {
        if (a.name && a.value && !SAMPLE_ATTR_CANDIDATES.includes(a.name)) {
            meta[a.name] = a.value;
        }
    }

    if (refs.length === 0) {
        // Not necessarily an issue; many pads could be empty
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
    // We’ll search a few obvious tag names and harvest their text.
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

function looksLikeAudioPath(s: string): boolean {
    const v = s.trim();
    if (!v) return false;

    // common audio extensions you care about for Bitbox workflows
    const lower = v.toLowerCase();
    if (
        lower.endsWith(".wav") ||
        lower.endsWith(".aif") ||
        lower.endsWith(".aiff") ||
        lower.endsWith(".flac") ||
        lower.endsWith(".mp3")
    ) return true;

    // Some presets may store paths without extension; keep conservative:
    return false;
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