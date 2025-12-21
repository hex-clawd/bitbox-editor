import type { ListedFile } from "../services/fs/tauriFs";
import { listFolderOnce, readUtf8Text } from "../services/fs/tauriFs";
import type { BitboxPreset } from "../core/domain/bitboxPreset";
import { parseBitboxPresetXml } from "../core/xml/bitboxPresetParser";

type Ok<T> = { ok: true } & T;
type Err = { ok: false; error: string };
type Result<T> = Ok<T> | Err;

function joinPath(a: string, b: string) {
    if (a.endsWith("/")) return `${a}${b}`;
    return `${a}/${b}`;
}

function isPresetFolderCandidate(x: ListedFile) {
    return x.isDir;
}

function hasPresetXml(children: ListedFile[]) {
    return children.some((c) => !c.isDir && c.name.toLowerCase() === "preset.xml");
}

function toPresetXmlFile(presetFolder: ListedFile): ListedFile {
    return {
        name: "preset.xml",
        path: joinPath(presetFolder.path, "preset.xml"),
        isDir: false,
    };
}

/**
 * Normalizes parser output to a strict BitboxPreset + warnings array.
 * Supports both:
 *  - BitboxPreset
 *  - { preset: BitboxPreset, warnings?: string[] }  (or similar wrapper)
 */
function normalizeParsedPreset(parsed: unknown): { preset: BitboxPreset; warnings: string[] } {
    const anyParsed = parsed as any;

    // Case A: parser already returns a BitboxPreset-like object
    if (anyParsed && typeof anyParsed === "object" && "pads" in anyParsed) {
        const preset = anyParsed as BitboxPreset;
        const warnings: string[] = Array.isArray((preset as any).warnings) ? (preset as any).warnings : [];
        return { preset, warnings };
    }

    // Case B: parser returns a wrapper { preset, warnings }
    if (anyParsed && typeof anyParsed === "object" && "preset" in anyParsed) {
        const preset = anyParsed.preset as BitboxPreset;
        const warnings: string[] = Array.isArray(anyParsed.warnings) ? anyParsed.warnings : [];
        return { preset, warnings };
    }

    throw new Error(
        `Parser returned unexpected shape (expected BitboxPreset or { preset: BitboxPreset, warnings?: string[] }). Got: ${Object.prototype.toString.call(
            parsed
        )}`
    );
}

export class PresetBrowserController {
    /**
     * User selects ROOT.
     * We list ROOT/Presets and return preset folders (those containing preset.xml).
     */
    async loadFolder(rootPath: string): Promise<Result<{ items: ListedFile[] }>> {
        try {
            const presetsPath = joinPath(rootPath, "Presets");
            console.log("[PresetBrowserController] loadFolder rootPath =", rootPath);
            console.log("[PresetBrowserController] scanning presetsPath =", presetsPath);

            const entries = await listFolderOnce(presetsPath);
            console.log(
                "[PresetBrowserController] entries under presetsPath:",
                entries.map((e) => ({ name: e.name, isDir: e.isDir, path: e.path }))
            );

            const candidateFolders = entries.filter(isPresetFolderCandidate);

            // Filter to folders that contain preset.xml
            const presetFolders: ListedFile[] = [];
            for (const folder of candidateFolders) {
                const children = await listFolderOnce(folder.path);
                if (hasPresetXml(children)) presetFolders.push(folder);
            }

            console.log(
                "[PresetBrowserController] presetFolders:",
                presetFolders.map((f) => f.name)
            );

            return { ok: true, items: presetFolders };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }

    /**
     * Loads and parses a preset XML file (ROOT/Presets/<PresetName>/preset.xml).
     */
    async loadPresetXml(xmlFile: ListedFile): Promise<Result<{ xml: string; preset: BitboxPreset }>> {
        try {
            console.log("[PresetBrowserController] loadPresetXml path =", xmlFile.path);

            const xml = await readUtf8Text(xmlFile.path);

            const parsed = parseBitboxPresetXml(xml);
            const { preset, warnings } = normalizeParsedPreset(parsed);

            // Ensure warnings are attached to preset for UI consumption
            const anyPreset = preset as any;
            if (!Array.isArray(anyPreset.warnings)) anyPreset.warnings = [];
            if (warnings.length) anyPreset.warnings.push(...warnings);

            // Absolute last-resort: prevent UI crash if pads is missing
            if (!("pads" in (preset as any))) {
                anyPreset.warnings.push("Parsed preset is missing 'pads' field; using empty pads to avoid crash.");
                anyPreset.pads = [];
            }

            console.log("[PresetBrowserController] parsed preset keys:", Object.keys(preset as any));
            console.log("[PresetBrowserController] pads type:", typeof (preset as any).pads);

            return { ok: true, xml, preset };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }
}