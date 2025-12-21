import type { AssetRef, BitboxPreset, Pad, SampleRef } from "../domain/bitboxPreset";

export type ParseResult =
    | { ok: true; preset: BitboxPreset }
    | { ok: false; error: string; preset?: BitboxPreset };

const PRESET_NAME_ATTR_CANDIDATES = ["name", "presetName", "title"];

/**
 * Schema-aware Blackbox preset parser (document > session semantics).
 * Pure: no file system, no UI.
 */
export function parseBitboxPresetXml(inputXml: string): ParseResult {
    // Strip embedded NUL bytes (exports sometimes contain trailing 0x00)
    const xml = stripNulBytes(inputXml);

    const warnings: string[] = [];
    const trimmed = xml.trim();
    if (!trimmed) return { ok: false, error: "XML is empty." };

    let doc: Document;
    try {
        doc = new DOMParser().parseFromString(xml, "application/xml");
    } catch (e) {
        return { ok: false, error: `DOMParser failed: ${String(e)}` };
    }

    const parserError = doc.getElementsByTagName("parsererror")[0];
    if (parserError) {
        // Best-effort salvage: strip trailing junk after last '>'
        const salvaged = salvageTrailingJunk(xml);
        if (salvaged.xml !== xml) {
            const doc2 = new DOMParser().parseFromString(salvaged.xml, "application/xml");
            const parserError2 = doc2.getElementsByTagName("parsererror")[0];
            if (!parserError2) {
                doc = doc2;
                warnings.push(...salvaged.warnings);
            } else {
                return { ok: false, error: `Invalid XML (after salvage): ${parserError2.textContent ?? "parsererror"}` };
            }
        } else {
            return { ok: false, error: `Invalid XML: ${parserError.textContent ?? "parsererror"}` };
        }
    }

    const name = detectPresetName(doc, warnings);

    const sessionEl = findDocumentSession(doc);
    if (!sessionEl) {
        return { ok: false, error: "Could not find <document><session> element (expected Blackbox preset structure)." };
    }

    // Collect DIRECT children <cell> of session
    const sessionCells = Array.from(sessionEl.children).filter(
        (el) => el.tagName === "cell" || el.tagName === "Cell"
    ) as Element[];

    // Partition cells by type
    const padCandidateCells = sessionCells.filter((c) => hasAttr(c, "row") && hasAttr(c, "column"));
    const assetCells = sessionCells.filter((c) => (c.getAttribute("type") ?? "").toLowerCase() === "asset");

    // Build pads from padCandidateCells, but only those that are meaningful + of type sample (for now)
    const pads = parsePadsFromSessionCells(padCandidateCells, warnings);

    // Link assets to pads using params@asssrcrow/asssrccol
    const assets = parseAssets(assetCells, warnings);
    linkAssetsToPads(pads, assets, warnings);

    // Build sampleRefs convenience list
    const sampleRefs: SampleRef[] = [];

    for (const p of pads) {
        if (p.filename) {
            const kind = classifyRefKind(p.filename);
            sampleRefs.push({
                path: p.filename,
                role: "pad",
                padIndex: p.index,
                xmlHint: `document/session/cell[row=${p.grid.row},col=${p.grid.column}]@filename`,
                refKind: kind,
            });
        }
        for (const a of p.assets) {
            const kind = classifyRefKind(a.filename);
            sampleRefs.push({
                path: a.filename,
                role: "asset",
                padIndex: p.index,
                xmlHint: `document/session/cell[type=asset]@filename -> pad[row=${p.grid.row},col=${p.grid.column}]`,
                refKind: kind,
            });
        }
    }

    const preset: BitboxPreset = {
        name,
        pads: pads.sort((a, b) => a.index - b.index),
        sampleRefs: dedupeSampleRefs(sampleRefs),
        warnings,
        rawXml: inputXml,
    };

    return { ok: true, preset };
}

// -------------------------
// Session traversal
// -------------------------

function findDocumentSession(doc: Document): Element | null {
    // We expect: <document> <session> ... </session> </document>
    const documentEls = Array.from(doc.getElementsByTagName("document"));
    const docEl = documentEls[0] ?? doc.documentElement;

    if (!docEl) return null;

    // Find first direct <session> child under <document> if possible
    const directSession = Array.from(docEl.children).find((c) => c.tagName === "session" || c.tagName === "Session");
    if (directSession) return directSession as Element;

    // Fallback: any session anywhere
    const sessions = docEl.getElementsByTagName("session");
    if (sessions.length > 0) return sessions[0];

    const sessions2 = docEl.getElementsByTagName("Session");
    if (sessions2.length > 0) return sessions2[0];

    return null;
}

// -------------------------
// Pad parsing (only session direct children)
// -------------------------

function parsePadsFromSessionCells(cells: Element[], warnings: string[]): Pad[] {
    // Infer grid width by max column in candidate pad cells
    const cols = cells
        .map((c) => parseIntSafe(c.getAttribute("column")))
        .filter((n): n is number => n !== undefined);
    const maxCol = cols.length ? Math.max(...cols) : 0;
    const gridWidth = Math.max(1, maxCol + 1);

    // Group and MERGE pads by (row,col)
    const padMap = new Map<string, Pad>();

    for (const cell of cells) {
        const row = parseIntSafe(cell.getAttribute("row"));
        const column = parseIntSafe(cell.getAttribute("column"));
        if (row == null || column == null) continue;

        const type = (cell.getAttribute("type") ?? "").toLowerCase();
        // Your current focus is pads of type sample
        // (You can loosen this later to include other pad types.)
        if (type && type !== "sample") continue;

        const key = `${row},${column}`;
        const index = row * gridWidth + column;

        const filename = cell.getAttribute("filename")?.trim() ?? undefined;

        const paramsEl = firstChildByTag(cell, "params");
        const params = paramsEl ? attributesToRecord(paramsEl) : {};

        // Slices (if present)
        const slices = extractSlices(cell);

        // Determine sampleKind: multisample vs slice vs single
        const sampleKind = classifySampleKind(params, slices);

        // Merge strategy:
        // - filename: keep first non-empty, else take new
        // - params: fill missing keys (first wins is safest)
        // - slices: if existing has none and new has some, take new (or keep longer)
        const existing = padMap.get(key);
        if (!existing) {
            padMap.set(key, {
                index,
                grid: { row, column },
                type: type || "sample",
                sampleKind,
                filename,
                params,
                slices: slices.length ? slices : undefined,
                assets: [],
                meta: undefined,
            });
        } else {
            // filename
            if (!existing.filename && filename) existing.filename = filename;

            // params: first wins, but fill gaps
            for (const [k, v] of Object.entries(params)) {
                if (existing.params[k] == null) existing.params[k] = v;
            }

            // sampleKind: upgrade unknown to known, or keep existing
            if (existing.sampleKind === "unknown" && sampleKind !== "unknown") {
                existing.sampleKind = sampleKind;
            }

            // slices: prefer non-empty; if both non-empty prefer longer list
            if ((!existing.slices || existing.slices.length === 0) && slices.length > 0) {
                existing.slices = slices;
            } else if (existing.slices && slices.length > (existing.slices?.length ?? 0)) {
                existing.slices = slices;
            }

            // meta: merge other cell attributes (excluding structural ones)
            const meta: Record<string, string> = { ...(existing.meta ?? {}) };
            for (const a of Array.from(cell.attributes)) {
                if (a.name === "row" || a.name === "column" || a.name === "layer" || a.name === "filename" || a.name === "type")
                    continue;
                if (meta[a.name] == null) meta[a.name] = a.value;
            }
            existing.meta = Object.keys(meta).length ? meta : existing.meta;
        }
    }

    const pads = Array.from(padMap.values());

    // Filter: keep only pads that are “filled in”
    // Definition: has filename OR has params OR has slices
    const filtered = pads.filter((p) => !!p.filename || Object.keys(p.params).length > 0 || (p.slices?.length ?? 0) > 0);

    if (filtered.length === 0) {
        warnings.push("No pad cells detected under document/session with row+column (type=sample).");
    }

    return filtered;
}

function classifySampleKind(params: Record<string, string>, slices: number[]): Pad["sampleKind"] {
    // multisammode="1" strongly indicates multisample pad
    const multisam = params["multisammode"];
    if (multisam === "1") return "multisample";

    // slices present => slice pad
    if (slices.length > 0) return "slice";

    // Otherwise it's usually a single sample/oneshot/loop in Blackbox
    return "single";
}

function extractSlices(cell: Element): number[] {
    // <slices><slice pos="..."/></slices>
    const slicesEl = firstChildByTag(cell, "slices");
    if (!slicesEl) return [];

    const sliceEls = Array.from(slicesEl.getElementsByTagName("slice"));
    const out: number[] = [];
    for (const s of sliceEls) {
        const pos = parseIntSafe(s.getAttribute("pos"));
        if (pos != null) out.push(pos);
    }
    return out;
}

// -------------------------
// Asset parsing + linking
// -------------------------

function parseAssets(assetCells: Element[], warnings: string[]): AssetRef[] {
    const assets: AssetRef[] = [];

    for (const cell of assetCells) {
        const filename = cell.getAttribute("filename")?.trim();
        if (!filename) continue;

        const paramsEl = firstChildByTag(cell, "params");
        const params = paramsEl ? attributesToRecord(paramsEl) : {};

        const asssrcrow = parseIntSafe(params["asssrcrow"]);
        const asssrccol = parseIntSafe(params["asssrccol"]);

        const rootnote = parseIntSafe(params["rootnote"]);
        const keyrangebottom = parseIntSafe(params["keyrangebottom"]);
        const keyrangetop = parseIntSafe(params["keyrangetop"]);
        const velrangebottom = parseIntSafe(params["velrangebottom"]);
        const velrangetop = parseIntSafe(params["velrangetop"]);

        assets.push({
            filename,
            params,
            sourcePad: asssrcrow != null && asssrccol != null ? { row: asssrcrow, column: asssrccol } : undefined,
            rootnote: rootnote ?? undefined,
            keyrange: { bottom: keyrangebottom ?? undefined, top: keyrangetop ?? undefined },
            velrange: { bottom: velrangebottom ?? undefined, top: velrangetop ?? undefined },
        });
    }

    if (assets.length === 0 && assetCells.length > 0) {
        warnings.push("Found asset cells but could not parse any usable assets (missing filename?).");
    }

    return assets;
}

function linkAssetsToPads(pads: Pad[], assets: AssetRef[], warnings: string[]): void {
    const padByRC = new Map<string, Pad>();
    for (const p of pads) {
        padByRC.set(`${p.grid.row},${p.grid.column}`, p);
    }

    let linked = 0;
    let unlinked = 0;

    for (const a of assets) {
        if (a.sourcePad) {
            const key = `${a.sourcePad.row},${a.sourcePad.column}`;
            const pad = padByRC.get(key);
            if (pad) {
                pad.assets.push(a);
                linked++;
                continue;
            }
        }
        unlinked++;
    }

    if (assets.length > 0) {
        warnings.push(`Assets linked via asssrcrow/asssrccol: ${linked}/${assets.length} (unlinked: ${unlinked}).`);
    }

    // Optional secondary heuristic (folder-root match) could be added later, but
    // explicit asssrcrow/asssrccol is the “safe” linkage you described.
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
// Helpers
// -------------------------

function stripNulBytes(s: string): string {
    return s.replace(/\u0000/g, "");
}

function salvageTrailingJunk(input: string): { xml: string; warnings: string[] } {
    const warnings: string[] = [];
    const s = stripNulBytes(input).trim();
    const lastGt = s.lastIndexOf(">");
    if (lastGt >= 0 && lastGt < s.length - 1) {
        warnings.push(`Stripped ${s.length - (lastGt + 1)} trailing characters after last '>'.`);
        return { xml: s.slice(0, lastGt + 1), warnings };
    }
    return { xml: s, warnings };
}

function parseIntSafe(v: string | null | undefined): number | undefined {
    if (v == null) return undefined;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
}

function hasAttr(el: Element, name: string): boolean {
    const v = el.getAttribute(name);
    return v != null && v !== "";
}

function firstChildByTag(parent: Element, tag: string): Element | null {
    for (const c of Array.from(parent.children)) {
        if (c.tagName === tag || c.tagName === tag[0].toUpperCase() + tag.slice(1)) return c as Element;
    }
    return null;
}

function attributesToRecord(el: Element): Record<string, string> {
    const out: Record<string, string> = {};
    for (const a of Array.from(el.attributes)) out[a.name] = a.value;
    return out;
}

function classifyRefKind(path: string): "sample" | "folder" | "unknown" {
    const v = path.trim();
    if (!v) return "unknown";
    const lower = v.toLowerCase();
    const extMatch = lower.match(/\.([a-z0-9]{1,8})$/);
    if (extMatch) return "sample";
    if (v.includes("\\") || v.includes("/")) return "folder";
    return "unknown";
}

function dedupeSampleRefs(refs: SampleRef[]): SampleRef[] {
    const seen = new Set<string>();
    const out: SampleRef[] = [];
    for (const r of refs) {
        const key = `${r.role}||${r.path}||${r.padIndex ?? ""}||${r.xmlHint ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(r);
    }
    return out;
}